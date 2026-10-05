"""Advection nowcast from a stack of rainfall frames.

Fixes after review:

* **pySTEPS expects decibels.** Optical flow on raw mm/hr tracks the bright core
  of a storm and smears everything else, because rain rates are heavy-tailed.
  Frames are now converted with the standard dBR transform, advected, and
  converted back. This is what `pysteps.utils.transformation.dB_transform` is
  for, and skipping it is the single most common way to get a bad nowcast out
  of a correct pipeline.
* **No-rain must be masked, not zero.** Zeros drag the motion field towards
  stillness. Values below the rain threshold become NaN for the flow
  computation and are restored as zero afterwards.
* **A sidecar records the time step.** The API labelled bands "+0, +5, +10 min"
  regardless of the real interval. IMERG is 30-minute data, so 12 bands is 6
  hours, not an hour. The time step now travels with the raster.
* **Persistence is always produced.** It is the baseline the nowcast has to
  beat, and generating it here means the comparison cannot be skipped later.

Usage:
    python -m pipeline.nowcast_pysteps --frames-dir data/processed/frames/chennai \\
        --output data/processed/forecasts --leadtimes 6 --timestep-minutes 30
"""
from __future__ import annotations

import argparse
import json
import logging
import warnings
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("nowcast")

try:
    from pysteps.motion.lucaskanade import dense_lucaskanade
    from pysteps.extrapolation.semilagrangian import extrapolate
    HAS_PYSTEPS = True
except ImportError:  # pragma: no cover - environment dependent
    HAS_PYSTEPS = False

#: Rain rates below this are treated as no rain (mm/hr).
RAIN_THRESHOLD_MM_HR = 0.1
#: dBR value assigned to no-rain cells after transformation.
ZERO_DBR = 10.0 * np.log10(RAIN_THRESHOLD_MM_HR)


def to_dbr(rain_mm_hr: np.ndarray) -> np.ndarray:
    """mm/hr -> dBR, with sub-threshold cells masked as NaN for the flow solver."""
    rain = np.asarray(rain_mm_hr, dtype=np.float64)
    dbr = np.full(rain.shape, np.nan)
    wet = rain >= RAIN_THRESHOLD_MM_HR
    dbr[wet] = 10.0 * np.log10(rain[wet])
    return dbr


def from_dbr(dbr: np.ndarray) -> np.ndarray:
    """dBR -> mm/hr. NaN and sub-threshold values come back as dry."""
    rain = np.power(10.0, np.asarray(dbr, dtype=np.float64) / 10.0)
    rain[~np.isfinite(dbr)] = 0.0
    rain[rain < RAIN_THRESHOLD_MM_HR] = 0.0
    return rain


def persistence_forecast(last_frame: np.ndarray, leadtimes: int) -> np.ndarray:
    """The baseline: tomorrow looks like now. Beat this or the nowcast adds nothing."""
    return np.repeat(last_frame[np.newaxis, ...], leadtimes, axis=0)


def run_nowcast(
    frames: np.ndarray,
    leadtimes: int,
) -> tuple[np.ndarray, str]:
    """Advect the most recent frame forward. Returns (forecast_mm_hr, method)."""
    if frames.shape[0] < 2:
        raise ValueError(
            f"Optical flow needs at least 2 consecutive frames; got {frames.shape[0]}."
        )

    if not HAS_PYSTEPS:
        log.warning("pysteps is not installed. Falling back to persistence, which is the baseline, not a nowcast.")
        return persistence_forecast(frames[-1], leadtimes), "persistence (pysteps unavailable)"

    log.info("Transforming %d frames to dBR (threshold %.2f mm/hr)...", frames.shape[0], RAIN_THRESHOLD_MM_HR)
    dbr_frames = np.stack([to_dbr(frame) for frame in frames])

    wet_fraction = float(np.mean(np.isfinite(dbr_frames)))
    log.info("Wet cells: %.1f%% of the domain.", wet_fraction * 100)
    if wet_fraction < 0.01:
        log.warning("Almost no rain in the input frames. Optical flow has nothing to track; using persistence.")
        return persistence_forecast(frames[-1], leadtimes), "persistence (domain is essentially dry)"

    # Lucas-Kanade wants finite values; NaN marks "no echo" and is filled with
    # the no-rain dBR floor only for the flow computation.
    flow_input = np.where(np.isfinite(dbr_frames), dbr_frames, ZERO_DBR)

    log.info("Computing motion field (Lucas-Kanade)...")
    motion = dense_lucaskanade(flow_input)

    log.info("Advecting %d lead times (semi-Lagrangian)...", leadtimes)
    advected = extrapolate(flow_input[-1], motion, leadtimes)

    forecast = np.stack([from_dbr(frame) for frame in advected])
    return forecast, "pySTEPS Lucas-Kanade optical flow + semi-Lagrangian advection, dBR space"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a rainfall nowcast from observed frames.")
    parser.add_argument("--frames-dir", required=True, type=Path,
                        help="Directory containing forecast.tif, a multi-band stack of observed frames.")
    parser.add_argument("--output", dest="output_dir", required=True, type=Path)
    parser.add_argument("--leadtimes", type=int, default=6, help="Number of future steps to predict.")
    parser.add_argument("--timestep-minutes", type=int, default=30,
                        help="Interval between frames. IMERG is 30-minute data; do not leave this at a guess.")
    args = parser.parse_args()

    try:
        import rasterio
    except ImportError:
        log.error("rasterio is required.")
        return 1

    input_file = args.frames_dir / "forecast.tif"
    if not input_file.is_file():
        log.error("Missing input stack: %s", input_file)
        log.error("Run pipeline/ingest_imerg.py first to produce it.")
        return 1

    with rasterio.open(input_file) as source:
        frames = source.read().astype(np.float64)
        meta = source.meta.copy()

    log.info("Read %d frames of %sx%s from %s", frames.shape[0], frames.shape[1], frames.shape[2], input_file.name)

    span_minutes = frames.shape[0] * args.timestep_minutes
    log.info("Input covers %.1f h of observations at %d-minute steps.", span_minutes / 60, args.timestep_minutes)

    forecast, method = run_nowcast(frames, args.leadtimes)
    forecast = np.clip(forecast, 0.0, None)
    baseline = np.clip(persistence_forecast(frames[-1], args.leadtimes), 0.0, None)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    meta.update(count=args.leadtimes, dtype="float32", compress="deflate")

    forecast_path = args.output_dir / "pysteps_forecast.tif"
    with rasterio.open(forecast_path, "w", **meta) as destination:
        destination.write(forecast.astype(np.float32))

    baseline_path = args.output_dir / "persistence_baseline.tif"
    with rasterio.open(baseline_path, "w", **meta) as destination:
        destination.write(baseline.astype(np.float32))

    # The sidecar is what stops the API inventing "+5 min" labels.
    sidecar = {
        "produced_at": datetime.now(timezone.utc).isoformat(),
        "method": method,
        "timestep_minutes": args.timestep_minutes,
        "leadtimes": args.leadtimes,
        "max_lead_time_minutes": args.leadtimes * args.timestep_minutes,
        "units": "mm/hr",
        "rain_threshold_mm_hr": RAIN_THRESHOLD_MM_HR,
        "input_frames": int(frames.shape[0]),
        "input_file": str(input_file.name),
        "baseline_file": baseline_path.name,
        "caveats": [
            "Rain rates in mm/hr. To get a depth, multiply by the step duration in hours; "
            "do not sum the rates.",
            "Verify against observations with pipeline/evaluate_nowcast.py before quoting any score.",
        ],
    }
    forecast_path.with_suffix(".meta.json").write_text(json.dumps(sidecar, indent=2), encoding="utf-8")

    log.info("Wrote %s (%d bands, +%d min max lead time)", forecast_path.name, args.leadtimes,
             sidecar["max_lead_time_minutes"])
    log.info("Wrote %s for the persistence comparison.", baseline_path.name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
