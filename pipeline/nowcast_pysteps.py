import argparse
import contextlib
import io
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
METHODS = ("extrapolation", "extrapolation_db", "sprog")

# Measured on 68 launches (20-22 June 2025, Chennai 8 degree domain), S-PROG cut
# light-rain false alarms (FAR 0.401 -> 0.335 at 30 min) but lowered heavy-rain
# detection (POD 0.499 -> 0.403 at 10 mm/h, 30 min). Heavy rain is what drives
# flooding, and the 10 mm/h sample there is a few storms, too small to separate the
# methods. So the served default stays the original method until the full season
# says otherwise; the others are selectable and scored side by side.
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


def run_nowcast(frames_dir: str, output_dir: str, leadtimes: int, history: int = 4,
                method: str = DEFAULT_METHOD):
    in_path = Path(frames_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    tif_file = in_path / "forecast.tif"
    if not tif_file.exists():
        raise FileNotFoundError(f"Missing input file: {tif_file}. Did you run Step 1?")
        
    logging.info(f"Reading historical observation frames from {tif_file}")
    with rasterio.open(tif_file) as src:
        # Read all time steps from Step 1 (Shape: [time, lat, lon])
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

    # Save output as a multi-band GeoTIFF (each band is 1 timestep into the future)
    meta.update(count=leadtimes, dtype=rasterio.float32)
    
    out_file = out_path / "pysteps_forecast.tif"
    with rasterio.open(out_file, 'w', **meta) as dst:
        dst.write(forecast.astype(rasterio.float32))
        
    logging.info(f"Success! Nowcast exported to {out_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Step 2: Generate Radar Nowcast (pySTEPS)")
    parser.add_argument("--frames-dir", required=True, help="Directory containing Step 1 forecast.tif")
    parser.add_argument("--leadtimes", type=int, default=12, help="Number of timesteps (bands) to predict")
    parser.add_argument("--output", required=True, dest="output_dir", help="Output directory for predictions")
    parser.add_argument("--history", type=int, default=4,
                        help="Most recent frames used for the motion field (default 4)")
    parser.add_argument("--method", choices=METHODS, default=DEFAULT_METHOD,
                        help=f"Nowcasting method (default {DEFAULT_METHOD})")

    args = parser.parse_args()
    run_nowcast(args.frames_dir, args.output_dir, args.leadtimes, args.history, args.method)
