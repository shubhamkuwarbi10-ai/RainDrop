"""
Per-pixel terrain features for the flood-depth surrogate.

Training and serving both import FEATURE_NAMES and build_vector from here, so the
feature order cannot drift between them. Reordering the vector on one side only is
the classic way a surrogate keeps a perfect training score while predicting nonsense
in production, and nothing in a pickled scikit-learn model catches it.

Two of these features are new, and they are the reason this module exists. The
surrogate used to receive slope and elevation as a single CITY-WIDE MEAN: every point
in Chennai was handed slope 1.32 deg and elevation 8.88 m, so terrain could not vary
the prediction anywhere within a city. It now reads the actual raster pixel, and gets
two fields that were already being computed by process_dem.py and then thrown away:

  log_flow_accum       log1p of the number of upstream cells draining through the
                       pixel. Raw accumulation is extremely skewed (median 2, max
                       ~490k in Chennai), so it is logged. Tells the model how much
                       water arrives from upslope.
  depression_depth_m   how far the pixel sits below its lowest neighbour. 0 outside
                       sinks, which is 76-88% of land. Tells the model whether water
                       that arrives can leave.

Without these the model cannot distinguish a ridge from the bottom of a ditch.
"""
from pathlib import Path

import numpy as np

PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"

# Order is the model's input contract. Append only; never reorder.
FEATURE_NAMES = (
    "total_precip_mm",
    "peak_intensity_mm_hr",
    "slope_deg",
    "elevation_m",
    "impermeability_pct",
    "log_flow_accum",
    "depression_depth_m",
)

# Terrain fields read from rasters, and the file each comes from.
TERRAIN_RASTERS = {
    "elevation_m": "{city}_dem_filled.tif",
    "slope_deg": "{city}_slope.tif",
    "log_flow_accum": "{city}_flow_accumulation.tif",
    "depression_depth_m": "{city}_depressions.tif",
}

# process_dem writes sea, and land below mean sea level, as exactly 0.5 m.
SEA_LEVEL_SENTINEL = 0.5

_OPEN = {}  # (city, field) -> open rasterio dataset, for the serving path


def _transform(field, values):
    """Raw raster values -> model units. Only flow accumulation is transformed."""
    return np.log1p(values) if field == "log_flow_accum" else values


def build_vector(total_precip_mm, peak_intensity_mm_hr, impermeability_pct, terrain):
    """Assemble one feature row in FEATURE_NAMES order. `terrain` is a dict of the
    four terrain fields; a missing key raises rather than silently defaulting."""
    row = {
        "total_precip_mm": total_precip_mm,
        "peak_intensity_mm_hr": peak_intensity_mm_hr,
        "impermeability_pct": impermeability_pct,
        **{k: terrain[k] for k in TERRAIN_RASTERS},
    }
    return [float(row[name]) for name in FEATURE_NAMES]


def sample_terrain(city, lat, lon, processed_dir=PROCESSED_DIR):
    """
    Terrain at one point, read from the city's rasters.

    Returns a dict of the four terrain fields, or None when the rasters are absent,
    the point falls outside them, or the pixel is sea. None means "no per-pixel
    terrain here" and the caller should fall back to the city mean rather than
    invent a value.
    """
    try:
        import rasterio
    except ImportError:
        return None

    out = {}
    for field, pattern in TERRAIN_RASTERS.items():
        key = (city, field)
        if key not in _OPEN:
            path = Path(processed_dir) / pattern.format(city=city)
            if not path.is_file():
                return None
            _OPEN[key] = rasterio.open(path)
        src = _OPEN[key]
        try:
            value = next(src.sample([(lon, lat)]))[0]
        except (StopIteration, IndexError, ValueError):
            return None
        if value is None or np.isnan(value):
            return None
        out[field] = float(_transform(field, np.float64(value)))

    # Outside the raster, rasterio returns the nodata fill rather than raising.
    # An elevation at or below the sea sentinel means the point is not on land here.
    if out["elevation_m"] <= SEA_LEVEL_SENTINEL:
        return None
    return out


def load_training_samples(cities=("chennai", "mumbai", "delhi"), per_city=2000,
                          processed_dir=PROCESSED_DIR, rng=None):
    """
    Sample land pixels from the city rasters, keeping the four terrain fields
    aligned to the SAME pixels. Sampling each field independently would destroy the
    correlation between slope, elevation and drainage that makes them informative.

    Returns a dict of field -> 1-D array, or None when too few pixels are available.
    """
    try:
        import rasterio
    except ImportError:
        return None

    rng = rng or np.random.default_rng(42)
    collected = {f: [] for f in TERRAIN_RASTERS}

    for city in cities:
        paths = {f: Path(processed_dir) / p.format(city=city)
                 for f, p in TERRAIN_RASTERS.items()}
        if not all(p.is_file() for p in paths.values()):
            continue
        try:
            grids = {f: rasterio.open(p).read(1).ravel() for f, p in paths.items()}
        except Exception:
            continue

        elev = grids["elevation_m"]
        valid = elev > SEA_LEVEL_SENTINEL
        for g in grids.values():
            valid &= ~np.isnan(g)
        n_valid = int(valid.sum())
        if n_valid == 0:
            continue

        idx = rng.choice(n_valid, size=min(per_city, n_valid), replace=False)
        for field, grid in grids.items():
            collected[field].append(_transform(field, grid[valid][idx].astype(np.float64)))

    if not collected["elevation_m"]:
        return None
    out = {f: np.concatenate(v) for f, v in collected.items()}
    return out if len(out["elevation_m"]) >= 500 else None
