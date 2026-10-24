import argparse
import contextlib
import io
import json
from datetime import datetime, timezone
import rasterio
import numpy as np
from pathlib import Path
import logging
import warnings

# Suppress annoying warnings from dependencies
warnings.filterwarnings("ignore")

try:
    from pysteps.motion.lucaskanade import dense_lucaskanade
    from pysteps.extrapolation.semilagrangian import extrapolate
    from pysteps.nowcasts import sprog
    from pysteps.utils import transformation
    HAS_PYSTEPS = True
except ImportError:  # pragma: no cover - import guard
    HAS_PYSTEPS = False

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# IMERG cells are 0.1 deg (~11 km). A 40x40 domain is ~440 km across, which holds
# roughly 4 hours of upwind rain at a typical 50 km/h storm motion -- enough for a
# 3 hour nowcast. Smaller domains cannot support optical flow.
MIN_DOMAIN_PX = 40

# Rain/no-rain boundary in mm/h, and the value dry cells take in dB space. pySTEPS
# convention: 0.1 mm/h becomes -10 dB, and dry cells sit below it at -15 dB.
RAIN_THRESHOLD_MMH = 0.1
ZEROVALUE_DB = -15.0

# S-PROG fits an AR(2) model per cascade level, so it needs ar_order + 1 frames.
SPROG_AR_ORDER = 2

# extrapolation     motion and advection on raw mm/h. The original method, kept so
#                   the effect of each change can be measured against it.
# extrapolation_db  the same, but in dB. Rain rates are roughly lognormal; pySTEPS
#                   estimates motion and advects in log space.
# sprog             S-PROG: decomposes the dB field into spatial scales and lets
#                   each decay at the rate its own autocorrelation implies, so small
#                   features that are not predictable fade instead of being carried
#                   forward intact. Aimed directly at false alarms.
# blend             extrapolation where extrapolation itself forecasts heavy rain,
#                   S-PROG everywhere else. See BLEND_SWITCH_MMH below.
METHODS = ("extrapolation", "extrapolation_db", "sprog", "blend")

# Measured over 815 launches (2025-06-20 to 09-30, Chennai 8 degree domain), the two
# methods win at opposite ends. Extrapolation beats persistence at 10 mm/h at every
# lead (CSI 0.423/0.254/0.161 against 0.393/0.237/0.150); S-PROG beats it at the
# 0.1 mm/h footprint at every lead (0.637/0.520/0.443 against 0.632/0.506/0.426) by
# letting unpredictable small scales fade. `blend` tried to take both: extrapolation
# where extrapolation itself forecasts >= BLEND_SWITCH_MMH, S-PROG elsewhere, switching
# on the forecast because the observation is not knowable at forecast time.
#
# MEASURED AND REJECTED, same 815 launches. The blend matches S-PROG exactly at
# 0.1 mm/h, but at 10 mm/h it scores 0.391/0.241/0.155 against extrapolation's
# 0.423/0.254/0.161 -- and at 30 min it falls below persistence (0.393). The switch
# cannot fire where extrapolation under-forecasts, which is exactly where the misses
# are, so the blend inherits S-PROG's lower detection and gains nothing.
#
# The useful conclusion is that there is no single best field: pick the method per
# question. Flood decisions ask about 10 mm/h, so they get extrapolation. A rain
# footprint asks about 0.1 mm/h, so it gets S-PROG. Kept selectable so the negative
# result stays reproducible.
BLEND_SWITCH_MMH = 10.0

DEFAULT_METHOD = "extrapolation"


def make_forecast(frames, leadtimes, method=DEFAULT_METHOD, threshold=RAIN_THRESHOLD_MMH):
    """
    Forecast `leadtimes` steps ahead from `frames` (t, rows, cols) in mm/h, oldest
    first, NaN-free. Returns (forecast, motion).

    `forecast` is (leadtimes, rows, cols) in mm/h. It keeps NaN wherever the method
    had no information -- typically rain advected in from outside the domain -- so
    the caller decides whether to zero those cells for output or exclude them from
    scoring. Zeroing them silently scores the forecast as predicting "no rain" there.
    """
    if method not in METHODS:
        raise ValueError(f"Unknown method {method!r}; choose one of {METHODS}")
    if not HAS_PYSTEPS:
        raise RuntimeError("pysteps is not installed, so no nowcast can be produced.")

    frames = np.asarray(frames, dtype=np.float64)

    if method == "blend":
        # Switch on the heavy-rain method's OWN forecast, not on the observation,
        # which is not available at forecast time. NaN wherever either input is NaN,
        # so the blend is scored on the same cells as the methods it is built from
        # rather than quietly inheriting the more generous of the two masks.
        heavy, motion = make_forecast(frames, leadtimes, "extrapolation", threshold)
        light, _ = make_forecast(frames, leadtimes, "sprog", threshold)
        blended = np.where(heavy >= BLEND_SWITCH_MMH, heavy, light)
        blended[np.isnan(heavy) | np.isnan(light)] = np.nan
        return blended, motion

    if method == "extrapolation":
        motion = dense_lucaskanade(frames)
        return extrapolate(frames[-1], motion, leadtimes), motion

    metadata = {"transform": None, "threshold": threshold, "zerovalue": 0.0, "unit": "mm/h"}
    frames_db, metadata = transformation.dB_transform(
        frames.copy(), metadata, threshold=threshold, zerovalue=ZEROVALUE_DB
    )
    motion = dense_lucaskanade(frames_db)

    if method == "extrapolation_db":
        forecast_db = extrapolate(frames_db[-1], motion, leadtimes)
    else:
        if frames_db.shape[0] < SPROG_AR_ORDER + 1:
            raise ValueError(
                f"S-PROG needs at least {SPROG_AR_ORDER + 1} frames, got {frames_db.shape[0]}"
            )
        # sprog prints a parameter table and per-step progress on every call; inside
        # a validation loop of hundreds of launches that buries everything else.
        with contextlib.redirect_stdout(io.StringIO()):
            forecast_db = sprog.forecast(
                frames_db[-(SPROG_AR_ORDER + 1):],
                motion,
                leadtimes,
                precip_thr=metadata["threshold"],
                ar_order=SPROG_AR_ORDER,
            )

    forecast, _ = transformation.dB_transform(forecast_db, metadata, inverse=True)
    return forecast, motion


# dBR helpers. make_forecast() goes through pysteps' own dB_transform, but these
# keep the rain <-> dB conversion importable and unit-testable without pysteps
# installed, which is what backend/tests/test_pipeline.py exercises.
#: dBR value assigned to no-rain cells after transformation.
ZERO_DBR = 10.0 * np.log10(RAIN_THRESHOLD_MMH)


def to_dbr(rain_mm_hr):
    """mm/hr -> dBR, with sub-threshold cells masked as NaN for the flow solver."""
    rain = np.asarray(rain_mm_hr, dtype=np.float64)
    dbr = np.full(rain.shape, np.nan)
    wet = rain >= RAIN_THRESHOLD_MMH
    dbr[wet] = 10.0 * np.log10(rain[wet])
    return dbr


def from_dbr(dbr):
    """dBR -> mm/hr. NaN and sub-threshold values come back as dry."""
    rain = np.power(10.0, np.asarray(dbr, dtype=np.float64) / 10.0)
    rain[~np.isfinite(dbr)] = 0.0
    rain[rain < RAIN_THRESHOLD_MMH] = 0.0
    return rain


def persistence_forecast(last_frame, leadtimes):
    """The baseline the nowcast has to beat. Beat this or the nowcast adds nothing."""
    return np.repeat(last_frame[np.newaxis, :, :], leadtimes, axis=0)


def run_nowcast(frames_dir, output_dir, leadtimes, history=4, method=DEFAULT_METHOD,
                timestep_minutes=30):
    in_path = Path(frames_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    tif_file = in_path / "forecast.tif"
    if not tif_file.exists():
        raise FileNotFoundError(f"Missing input file: {tif_file}. Did you run Step 1?")

    logging.info(f"Reading historical observation frames from {tif_file}")
    with rasterio.open(tif_file) as src:
        obs = src.read()
        meta = src.meta.copy()

    if obs.shape[0] < 2:
        raise ValueError("Need at least 2 consecutive time steps to calculate optical flow motion vectors.")

    if not HAS_PYSTEPS:
        # Previously this fell back to `obs[-1] * 0.85**i` -- exponential decay of the
        # last frame, with no motion and no advection -- and the output was still
        # written to pysteps_forecast.tif and served as "PySTEPS Radar Nowcast".
        # A missing core dependency must stop the pipeline, not quietly fake it.
        raise RuntimeError(
            "pysteps is not installed, so no nowcast can be produced.\n"
            "Install it with:  pip install pysteps\n"
            "(it is already listed in requirements.txt)"
        )

    rows, cols = obs.shape[1], obs.shape[2]
    if min(rows, cols) < MIN_DOMAIN_PX:
        # Optical flow needs enough grid to resolve motion, and the domain must hold
        # the rain that will advect into the target area over the forecast horizon.
        raise ValueError(
            f"Nowcast domain is {rows}x{cols} px, below the {MIN_DOMAIN_PX}x{MIN_DOMAIN_PX} minimum.\n"
            f"At ~11 km per IMERG cell that is only ~{min(rows, cols) * 11} km across, so storms "
            f"crossing it are gone within a timestep or two and no motion can be recovered.\n"
            "Re-run ingest_imerg.py with a wider --domain-deg (8 degrees is a reasonable default)."
        )

    # Motion must come from the MOST RECENT frames only. Passing the whole archive
    # averages motion over its entire span -- on a 3-day stack that collapsed a real
    # storm field to 0.17 px/timestep (~4 km/h), i.e. almost pure persistence.
    recent = obs[-history:] if history and obs.shape[0] > history else obs
    recent = np.nan_to_num(recent, nan=0.0)
    recent[recent < 0] = 0.0
    logging.info(
        f"Nowcasting with method={method} over a {rows}x{cols} domain "
        f"from the last {recent.shape[0]} of {obs.shape[0]} frames..."
    )
    forecast, motion_field = make_forecast(recent, leadtimes, method=method)

    speed = float(np.hypot(motion_field[0], motion_field[1]).mean())
    logging.info(f"Mean motion magnitude: {speed:.2f} px/timestep (~{speed * 11 * 2:.0f} km/h)")
    if speed == 0.0:
        logging.warning(
            "Motion field is identically zero: the forecast will be pure persistence. "
            "This usually means the frames carry no trackable precipitation structure."
        )

    # Cells with no advection information come back as NaN. They must not reach the
    # GeoTIFF: FastAPI would serialise a bare `NaN`, which is invalid JSON.
    forecast = np.nan_to_num(forecast, nan=0.0, posinf=0.0, neginf=0.0)
    forecast[forecast < 0] = 0.0
    baseline = np.clip(persistence_forecast(recent[-1], leadtimes), 0.0, None)

    # Save output as a multi-band GeoTIFF (each band is 1 timestep into the future)
    meta.update(count=leadtimes, dtype=rasterio.float32)

    out_file = out_path / "pysteps_forecast.tif"
    with rasterio.open(out_file, 'w', **meta) as dst:
        dst.write(forecast.astype(rasterio.float32))

    baseline_file = out_path / "persistence_baseline.tif"
    with rasterio.open(baseline_file, 'w', **meta) as dst:
        dst.write(baseline.astype(rasterio.float32))

    # The sidecar is what stops the API inventing "+5 min" band labels:
    # backend/app/api/ml_gis.py reads timestep_minutes from it and refuses to
    # label the bands at all when it is missing.
    sidecar = {
        "produced_at": datetime.now(timezone.utc).isoformat(),
        "method": method,
        "timestep_minutes": timestep_minutes,
        "leadtimes": leadtimes,
        "max_lead_time_minutes": leadtimes * timestep_minutes,
        "units": "mm/hr",
        "rain_threshold_mm_hr": RAIN_THRESHOLD_MMH,
        "input_frames": int(obs.shape[0]),
        "motion_frames": int(recent.shape[0]),
        "input_file": tif_file.name,
        "baseline_file": baseline_file.name,
        "mean_motion_px_per_step": round(speed, 3),
        "caveats": [
            "Rain rates in mm/hr. To get a depth, multiply by the step duration in hours; "
            "do not sum the rates.",
            "Verify against observations with pipeline/evaluate_nowcast.py before quoting any score.",
        ],
    }
    out_file.with_suffix(".meta.json").write_text(json.dumps(sidecar, indent=2), encoding="utf-8")

    logging.info(f"Success! Nowcast exported to {out_file}")
    logging.info(f"Wrote {baseline_file.name} for the persistence comparison.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Step 2: Generate Radar Nowcast (pySTEPS)")
    parser.add_argument("--frames-dir", required=True, help="Directory containing Step 1 forecast.tif")
    parser.add_argument("--leadtimes", type=int, default=12, help="Number of timesteps (bands) to predict")
    parser.add_argument("--output", required=True, dest="output_dir", help="Output directory for predictions")
    parser.add_argument("--history", type=int, default=4,
                        help="Most recent frames used for the motion field (default 4)")
    parser.add_argument("--method", choices=METHODS, default=DEFAULT_METHOD,
                        help=f"Nowcasting method (default {DEFAULT_METHOD})")
    parser.add_argument("--timestep-minutes", type=int, default=30,
                        help="Interval between frames. IMERG is 30-minute data; do not leave this at a guess.")

    args = parser.parse_args()
    run_nowcast(args.frames_dir, args.output_dir, args.leadtimes, args.history, args.method,
                args.timestep_minutes)
