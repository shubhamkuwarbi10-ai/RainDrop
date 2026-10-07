import argparse
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
    HAS_PYSTEPS = True
except ImportError:  # pragma: no cover - import guard
    HAS_PYSTEPS = False

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# IMERG cells are 0.1 deg (~11 km). A 40x40 domain is ~440 km across, which holds
# roughly 4 hours of upwind rain at a typical 50 km/h storm motion -- enough for a
# 3 hour nowcast. Smaller domains cannot support optical flow.
MIN_DOMAIN_PX = 40

def run_nowcast(frames_dir: str, output_dir: str, leadtimes: int, history: int = 4):
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
    logging.info(
        f"Computing Lucas-Kanade motion field over a {rows}x{cols} domain "
        f"from the last {recent.shape[0]} of {obs.shape[0]} frames..."
    )
    motion_field = dense_lucaskanade(recent)

    speed = float(np.hypot(motion_field[0], motion_field[1]).mean())
    logging.info(f"Mean motion magnitude: {speed:.2f} px/timestep (~{speed * 11 * 2:.0f} km/h)")
    if speed == 0.0:
        logging.warning(
            "Motion field is identically zero: the forecast will be pure persistence. "
            "This usually means the frames carry no trackable precipitation structure."
        )

    logging.info(f"Advecting precipitation field for {leadtimes} future timesteps...")
    forecast = extrapolate(obs[-1], motion_field, leadtimes)

    # extrapolate() fills areas advected in from outside the domain with NaN by
    # default. `forecast < 0` does not catch NaN, so without this the NaNs reach the
    # GeoTIFF and FastAPI serialises a bare `NaN`, which is invalid JSON.
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

    args = parser.parse_args()
    run_nowcast(args.frames_dir, args.output_dir, args.leadtimes, args.history)
