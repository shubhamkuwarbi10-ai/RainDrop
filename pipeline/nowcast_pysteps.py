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
except ImportError:
    dense_lucaskanade = None

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def run_nowcast(frames_dir: str, output_dir: str, leadtimes: int):
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

    if dense_lucaskanade is not None:
        logging.info("Calculating atmospheric motion vectors using Lucas-Kanade optical flow...")
        # 1. Compute motion field (u, v velocity components)
        motion_field = dense_lucaskanade(obs) 
        
        logging.info(f"Advecting precipitation field for {leadtimes} future timesteps...")
        # 2. Extrapolate future frames using Semi-Lagrangian advection
        forecast = extrapolate(obs[-1], motion_field, leadtimes) 
    else:
        logging.warning("pySTEPS library not found in environment! Using a dummy persistence model for demonstration...")
        # Dummy forecast: just slowly dissipate the last observed storm cell
        forecast = np.array([obs[-1] * (0.85 ** i) for i in range(1, leadtimes + 1)])

    # Ensure no negative precipitation due to numerical artifacts
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
    
    args = parser.parse_args()
    run_nowcast(args.frames_dir, args.output_dir, args.leadtimes)
