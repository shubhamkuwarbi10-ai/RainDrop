from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from app.core.paths import RAW_DIR

#: Terrain rasters must live here. Nothing outside it is readable through the API.
TERRAIN_SOURCE_DIR = RAW_DIR / "terrain"

#: Guard against a request that asks the server to load a continent into memory.
MAX_RASTER_CELLS = 120_000_000  # ~960 MB as float64, read band by band.


def resolve_dataset_path(dataset_file: str) -> Path:
    """Map a registered filename onto a path inside the terrain folder.

    The API accepts a bare filename, never a path. Resolving and then checking
    containment defeats `..` traversal, absolute paths and symlinks that point
    out of the folder.
    """
    if not dataset_file or "/" in dataset_file or "\\" in dataset_file or dataset_file.startswith("."):
        raise ValueError("Terrain dataset names must be a plain filename.")

    root = TERRAIN_SOURCE_DIR.resolve()
    candidate = (root / dataset_file).resolve()
    if not candidate.is_relative_to(root):
        raise ValueError("Terrain dataset names must resolve inside the terrain data folder.")
    if not candidate.is_file():
        raise FileNotFoundError("Registered terrain file is not present.")
    return candidate


def analyze_dem(path: Path | str) -> dict[str, float | str | datetime | None]:
    try:
        import rasterio
    except ImportError as exc:
        raise RuntimeError("rasterio is required for DEM processing") from exc

    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError("Terrain file not found.")

    with rasterio.open(path) as dataset:
        if dataset.width * dataset.height > MAX_RASTER_CELLS:
            raise ValueError(
                f"Raster is too large to process in one request "
                f"({dataset.width} x {dataset.height} cells). Tile it first."
            )
        elevation = dataset.read(1, masked=True).astype("float64")
        values = elevation.compressed()
        if values.size == 0:
            raise ValueError("Terrain raster contains no valid cells")
        pixel_width = abs(dataset.transform.a)
        pixel_height = abs(dataset.transform.e)
        if pixel_width == 0 or pixel_height == 0:
            raise ValueError("Terrain raster has invalid pixel dimensions")
        filled = elevation.filled(float(values.mean()))
        gradient_y, gradient_x = np.gradient(filled, pixel_height, pixel_width)
        slope = np.sqrt(gradient_x**2 + gradient_y**2)
        slope_values = np.ma.array(slope, mask=np.ma.getmaskarray(elevation)).compressed()
        return {
            "min_value": float(values.min()),
            "max_value": float(values.max()),
            "min_slope": float(slope_values.min()),
            "max_slope": float(slope_values.max()),
            "crs": str(dataset.crs) if dataset.crs else None,
            "processed_at": datetime.now(timezone.utc),
        }


def estimate_runoff(
    rainfall_mm: float,
    duration_minutes: float,
    catchment_area_m2: float,
    impervious_fraction: float,
    runoff_coefficient: float | None = None,
) -> dict[str, float]:
    coefficient = runoff_coefficient if runoff_coefficient is not None else 0.2 + 0.7 * impervious_fraction
    rainfall_m = rainfall_mm / 1000
    runoff_volume_m3 = rainfall_m * catchment_area_m2 * coefficient
    duration_seconds = duration_minutes * 60
    return {
        "rainfall_mm": rainfall_mm,
        "duration_minutes": duration_minutes,
        "catchment_area_m2": catchment_area_m2,
        "runoff_coefficient": coefficient,
        "runoff_volume_m3": runoff_volume_m3,
        "average_runoff_lps": runoff_volume_m3 / duration_seconds,
    }


def classify_flood_risk(water_depth_cm: float) -> str:
    if water_depth_cm >= 30:
        return "critical"
    if water_depth_cm >= 15:
        return "high"
    if water_depth_cm >= 5:
        return "moderate"
    return "low"