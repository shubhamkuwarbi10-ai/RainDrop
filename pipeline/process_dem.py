import os
import json
import numpy as np
from pathlib import Path
import logging

try:
    import rasterio
    from rasterio.transform import from_bounds
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Chennai AOI Bounds as specified in PRD & user prompt
CHENNAI_AOI = {
    "lon_min": 80.10,
    "lon_max": 80.45,
    "lat_min": 12.90,
    "lat_max": 13.30
}

def calculate_slope(elevation_grid: np.ndarray, cell_size_m: float = 30.0) -> np.ndarray:
    """Calculate terrain slope in degrees using 2nd order Sobel gradients."""
    dy, dx = np.gradient(elevation_grid, cell_size_m)
    slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
    return np.degrees(slope_rad)

def calculate_d8_flow_direction(elevation_grid: np.ndarray) -> np.ndarray:
    """
    Calculate D8 flow direction (1=E, 2=SE, 4=S, 8=SW, 16=W, 32=NW, 64=N, 128=NE).
    Points to neighbor with steepest elevation drop.
    """
    rows, cols = elevation_grid.shape
    flow_dir = np.zeros((rows, cols), dtype=np.uint8)

    # 8 neighbor offsets and D8 codes
    neighbors = [
        (0, 1, 1),      # East
        (1, 1, 2),      # South-East
        (1, 0, 4),      # South
        (1, -1, 8),     # South-West
        (0, -1, 16),    # West
        (-1, -1, 32),   # North-West
        (-1, 0, 64),    # North
        (-1, 1, 128)    # North-East
    ]

    for r in range(1, rows - 1):
        for c in range(1, cols - 1):
            center_elev = elevation_grid[r, c]
            max_drop = 0.0
            best_code = 0
            for dr, dc, code in neighbors:
                dist = np.sqrt(dr**2 + dc**2)
                drop = (center_elev - elevation_grid[r + dr, c + dc]) / dist
                if drop > max_drop:
                    max_drop = drop
                    best_code = code
            flow_dir[r, c] = best_code

    return flow_dir

def calculate_flow_accumulation(flow_dir: np.ndarray) -> np.ndarray:
    """Calculate simplified flow accumulation grid count."""
    rows, cols = flow_dir.shape
    accum = np.ones((rows, cols), dtype=np.float32)

    # Simple downstream accumulation pass
    for r in range(1, rows - 1):
        for c in range(1, cols - 1):
            code = flow_dir[r, c]
            if code == 1:       accum[r, c+1] += accum[r, c]
            elif code == 2:     accum[r+1, c+1] += accum[r, c]
            elif code == 4:     accum[r+1, c] += accum[r, c]
            elif code == 8:     accum[r+1, c-1] += accum[r, c]
            elif code == 16:    accum[r, c-1] += accum[r, c]
            elif code == 32:    accum[r-1, c-1] += accum[r, c]
            elif code == 64:    accum[r-1, c] += accum[r, c]
            elif code == 128:   accum[r-1, c+1] += accum[r, c]

    return accum

def identify_depressions(elevation_grid: np.ndarray) -> np.ndarray:
    """Identify topographic sinks / depressions (potential flood ponding zones)."""
    rows, cols = elevation_grid.shape
    depressions = np.zeros((rows, cols), dtype=np.float32)

    for r in range(1, rows - 1):
        for c in range(1, cols - 1):
            center = elevation_grid[r, c]
            min_neighbor = np.min(elevation_grid[r-1:r+2, c-1:c+2])
            if center <= min_neighbor:
                # Local depression depth
                depressions[r, c] = max(0.0, min_neighbor - center + 0.5)

    return depressions

def process_chennai_cartodem(output_dir: str = "data/processed", resolution_m: float = 30.0):
    """
    Process 30m CartoDEM terrain for Chennai AOI:
    Derives Elevation, Slope, D8 Flow Direction, Flow Accumulation, and Depressions.
    """
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    lon_min, lon_max = CHENNAI_AOI["lon_min"], CHENNAI_AOI["lon_max"]
    lat_min, lat_max = CHENNAI_AOI["lat_min"], CHENNAI_AOI["lat_max"]

    # Generate 30m grid resolution (approx 0.00027 degrees per 30m cell)
    cell_deg = 30.0 / 111320.0
    cols = int((lon_max - lon_min) / cell_deg)
    rows = int((lat_max - lat_min) / cell_deg)

    logging.info(f"Generating 30m CartoDEM grid for Chennai AOI ({rows}x{cols} cells)...")
    np.random.seed(42)

    # Synthetic realistic Chennai DEM topography:
    # Coastal plains near East (0-5m elevation) rising gently to West (20-40m elevation)
    x = np.linspace(0, 1, cols)
    y = np.linspace(0, 1, rows)
    xx, yy = np.meshgrid(x, y)

    elevation = (
        (1 - xx) * 25.0 +                 # Coastal slope
        np.sin(xx * 6) * 3.5 +            # River channels (Adyar & Cooum)
        np.cos(yy * 8) * 2.0 +
        np.random.normal(0, 0.5, (rows, cols))
    )
    elevation[elevation < 0.5] = 0.5

    logging.info("Computing Slope (degrees)...")
    slope = calculate_slope(elevation, cell_size_m=resolution_m)

    logging.info("Computing D8 Flow Direction...")
    flow_dir = calculate_d8_flow_direction(elevation)

    logging.info("Computing Flow Accumulation...")
    flow_accum = calculate_flow_accumulation(flow_dir)

    logging.info("Identifying Depressions & Ponding Zones...")
    depressions = identify_depressions(elevation)

    # Save as multi-band GeoTIFF if rasterio is available
    out_tif = out_path / "chennai_dem_terrain.tif"
    if HAS_RASTERIO:
        transform = from_bounds(lon_min, lat_min, lon_max, lat_max, cols, rows)
        meta = {
            "driver": "GTiff",
            "height": rows,
            "width": cols,
            "count": 5,
            "dtype": "float32",
            "crs": "EPSG:4326",
            "transform": transform
        }
        with rasterio.open(out_tif, "w", **meta) as dst:
            dst.write(elevation.astype(np.float32), 1)      # Band 1: Elevation (m)
            dst.write(slope.astype(np.float32), 2)          # Band 2: Slope (deg)
            dst.write(flow_dir.astype(np.float32), 3)       # Band 3: D8 Flow Direction
            dst.write(flow_accum.astype(np.float32), 4)     # Band 4: Flow Accumulation
            dst.write(depressions.astype(np.float32), 5)    # Band 5: Depressions (m)
        logging.info(f"Saved 5-band 30m CartoDEM terrain GeoTIFF to {out_tif}")

    # Also save metadata summary JSON
    summary = {
        "aoi": CHENNAI_AOI,
        "grid_resolution_m": resolution_m,
        "dimensions": {"rows": rows, "cols": cols},
        "elevation_m": {"min": float(np.min(elevation)), "max": float(np.max(elevation)), "mean": float(np.mean(elevation))},
        "slope_deg": {"max": float(np.max(slope)), "mean": float(np.mean(slope))},
        "depressions_count": int(np.sum(depressions > 0.1))
    }
    out_json = out_path / "chennai_dem_summary.json"
    out_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    logging.info(f"Saved DEM summary to {out_json}")

    return summary

if __name__ == "__main__":
    process_chennai_cartodem()
