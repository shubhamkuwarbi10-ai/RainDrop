import pickle
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "models" / "artifacts" / "flood_surrogate.pkl"
PROCESSED_PATH = PROJECT_ROOT / "data" / "processed"


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Surrogate model not found: {MODEL_PATH}")
    with MODEL_PATH.open("rb") as model_file:
        return pickle.load(model_file)


def sample_terrain(city: str, latitude: float, longitude: float) -> tuple[float, float]:
    try:
        import rasterio
    except ImportError as exc:
        raise RuntimeError("rasterio is required for surrogate prediction") from exc

    dem_path = PROCESSED_PATH / f"{city}_dem_filled.tif"
    slope_path = PROCESSED_PATH / f"{city}_slope.tif"
    if not dem_path.is_file() or not slope_path.is_file():
        raise FileNotFoundError(f"Processed DEM/slope rasters not found for city: {city}")

    with rasterio.open(dem_path) as dem, rasterio.open(slope_path) as slope:
        if not dem.bounds.left <= longitude <= dem.bounds.right or not dem.bounds.bottom <= latitude <= dem.bounds.top:
            raise ValueError(f"Location is outside the processed {city} DEM bounds")
        dem_row, dem_col = dem.index(longitude, latitude)
        slope_row, slope_col = slope.index(longitude, latitude)
        elevation = float(dem.read(1, window=((dem_row, dem_row + 1), (dem_col, dem_col + 1)))[0, 0])
        slope_deg = float(slope.read(1, window=((slope_row, slope_row + 1), (slope_col, slope_col + 1)))[0, 0])
    return elevation, slope_deg


def predict_depth(
    city: str,
    latitude: float,
    longitude: float,
    total_precip_mm: float,
    peak_intensity_mm_hr: float,
    impermeability_pct: float,
) -> dict[str, float | datetime]:
    elevation_m, slope_deg = sample_terrain(city, latitude, longitude)
    features = np.array([[total_precip_mm, peak_intensity_mm_hr, slope_deg, elevation_m, impermeability_pct]])
    water_depth_cm = max(0.0, float(load_model().predict(features)[0]))
    return {
        "total_precip_mm": total_precip_mm,
        "peak_intensity_mm_hr": peak_intensity_mm_hr,
        "elevation_m": elevation_m,
        "slope_deg": slope_deg,
        "impermeability_pct": impermeability_pct,
        "water_depth_cm": water_depth_cm,
        "predicted_at": datetime.now(timezone.utc),
    }