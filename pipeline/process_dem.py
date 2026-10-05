"""Build terrain layers for a city from a DEM raster.

Outputs, all written to data/processed/terrain/:
    {city}_dem_filled.tif          depression-filled elevation, metres, UTM
    {city}_slope.tif               slope in degrees
    {city}_flow_direction.tif      D8 direction codes
    {city}_flow_accumulation.tif   cells draining through each cell
    {city}_depressions.tif         depth of each filled depression, metres
    {city}_dem_summary.json        statistics, and whether a real raster was used

What changed after review:

* The mosaic was *stretched* into the city bounding box with scipy.ndimage.zoom,
  so every cell was the wrong size and the terrain was geometrically wrong. It
  is now windowed to the AOI, which is what cropping means.
* Everything was computed on a geographic (degree) grid while assuming 30 m
  cells. Rasters are now reprojected to the city's UTM zone first, so a cell
  really is its stated size in metres.
* Files called *_dem_filled.tif had no depression filling, and "flow
  accumulation" counted neighbours rather than contributing cells. Both are now
  the real algorithms (see pipeline/terrain_ops.py).
* When no raster is found the output is still produced, but `is_real_dem` is
  false and the label says so. Four cities used to be flagged as real ISRO
  CartoDEM with no tile on disk anywhere.

Usage:
    python -m pipeline.process_dem --city chennai
    python -m pipeline.process_dem --all
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.terrain_ops import (  # noqa: E402
    d8_flow_accumulation,
    d8_flow_direction,
    depression_depth,
    fill_depressions,
    slope_degrees,
    utm_epsg_for,
)

try:
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.merge import merge
    from rasterio.warp import calculate_default_transform, reproject
    from rasterio.windows import from_bounds as window_from_bounds
    HAS_RASTERIO = True
except ImportError:  # pragma: no cover - environment dependent
    HAS_RASTERIO = False

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("process_dem")

ROOT = Path(__file__).resolve().parent.parent
RAW_DEM_DIR = ROOT / "data" / "raw" / "cartodem"
OUTPUT_DIR = ROOT / "data" / "processed" / "terrain"

# Areas of interest. Kept tight: a larger box means a slower fill and little
# extra signal for a municipal ward.
CITY_AOIS = {
    "chennai": {"name": "Chennai", "lon_min": 80.10, "lon_max": 80.45, "lat_min": 12.90, "lat_max": 13.30,
                "fallback_elevation": 12.0, "fallback_relief": 25.0},
    "mumbai": {"name": "Mumbai", "lon_min": 72.75, "lon_max": 73.05, "lat_min": 18.88, "lat_max": 19.28,
               "fallback_elevation": 8.0, "fallback_relief": 45.0},
    "delhi": {"name": "Delhi", "lon_min": 76.84, "lon_max": 77.35, "lat_min": 28.40, "lat_max": 28.90,
              "fallback_elevation": 215.0, "fallback_relief": 35.0},
}

TARGET_RESOLUTION_M = 30.0
#: Above this many cells the priority-flood fill becomes slow in pure Python.
MAX_CELLS = 4_000_000


def _load_real_dem(city_key: str, aoi: dict):
    """Window every raster that overlaps the AOI, mosaic, and return it.

    Returns (elevation, transform, crs) or None when no raster covers the city.
    """
    if not HAS_RASTERIO or not RAW_DEM_DIR.exists():
        return None

    candidates = []
    for path in sorted(RAW_DEM_DIR.glob("*.tif")) + sorted(RAW_DEM_DIR.glob("*.TIF")):
        try:
            source = rasterio.open(path)
        except rasterio.errors.RasterioIOError:
            log.warning("Could not open %s; skipping.", path.name)
            continue
        bounds = source.bounds
        overlaps = not (
            bounds.right < aoi["lon_min"] or bounds.left > aoi["lon_max"]
            or bounds.top < aoi["lat_min"] or bounds.bottom > aoi["lat_max"]
        )
        if overlaps:
            candidates.append(source)
        else:
            source.close()

    if not candidates:
        return None

    try:
        # Crop to the AOI. The previous code resampled the whole mosaic into the
        # AOI's pixel dimensions, which stretches the terrain instead.
        mosaic, transform = merge(
            candidates,
            bounds=(aoi["lon_min"], aoi["lat_min"], aoi["lon_max"], aoi["lat_max"]),
        )
        crs = candidates[0].crs
    finally:
        for source in candidates:
            source.close()

    elevation = mosaic[0].astype(np.float32)
    log.info("Loaded %d DEM tile(s) for %s: %s cells", len(candidates), aoi["name"], elevation.shape)
    return elevation, transform, crs


def _synthetic_dem(city_key: str, aoi: dict):
    """A smooth placeholder surface, clearly labelled as not real terrain.

    This exists so the rest of the pipeline is runnable before anyone has
    downloaded a tile. Nothing derived from it may be presented as measured.
    """
    cell_degrees = TARGET_RESOLUTION_M / 111_320.0
    cols = max(60, int((aoi["lon_max"] - aoi["lon_min"]) / cell_degrees))
    rows = max(60, int((aoi["lat_max"] - aoi["lat_min"]) / cell_degrees))
    cols, rows = min(cols, 1200), min(rows, 1200)

    generator = np.random.default_rng(abs(hash(city_key)) % (2**32))
    x = np.linspace(0, 1, cols)
    y = np.linspace(0, 1, rows)
    grid_x, grid_y = np.meshgrid(x, y)

    elevation = (
        aoi["fallback_elevation"]
        + (1 - grid_x) * aoi["fallback_relief"]
        + np.sin(grid_x * 6) * 3.5
        + np.cos(grid_y * 8) * 2.0
        + generator.normal(0, 0.5, (rows, cols))
    ).astype(np.float32)
    elevation = np.maximum(elevation, 0.5)

    if HAS_RASTERIO:
        from rasterio.transform import from_bounds
        transform = from_bounds(aoi["lon_min"], aoi["lat_min"], aoi["lon_max"], aoi["lat_max"], cols, rows)
        return elevation, transform, rasterio.crs.CRS.from_epsg(4326)
    return elevation, None, None


def _reproject_to_utm(elevation, transform, crs, aoi):
    """Project onto an equal-spacing metre grid so slope means something."""
    target_epsg = utm_epsg_for(
        (aoi["lon_min"] + aoi["lon_max"]) / 2,
        (aoi["lat_min"] + aoi["lat_max"]) / 2,
    )
    target_crs = rasterio.crs.CRS.from_epsg(target_epsg)

    if crs is not None and crs.to_epsg() == target_epsg:
        return elevation, transform, target_crs, target_epsg

    height, width = elevation.shape
    left, bottom, right, top = rasterio.transform.array_bounds(height, width, transform)
    dst_transform, dst_width, dst_height = calculate_default_transform(
        crs, target_crs, width, height, left, bottom, right, top,
        resolution=TARGET_RESOLUTION_M,
    )

    destination = np.empty((dst_height, dst_width), dtype=np.float32)
    reproject(
        source=elevation,
        destination=destination,
        src_transform=transform,
        src_crs=crs,
        dst_transform=dst_transform,
        dst_crs=target_crs,
        resampling=Resampling.bilinear,
    )
    log.info("Reprojected to EPSG:%d at %.0f m: %s cells", target_epsg, TARGET_RESOLUTION_M, destination.shape)
    return destination, dst_transform, target_crs, target_epsg


def process_city(city_key: str, output_dir: Path = OUTPUT_DIR) -> dict:
    if city_key not in CITY_AOIS:
        raise ValueError(f"Unknown city '{city_key}'. Available: {', '.join(CITY_AOIS)}")

    aoi = CITY_AOIS[city_key]
    output_dir.mkdir(parents=True, exist_ok=True)
    log.info("--- %s ---", aoi["name"])

    loaded = _load_real_dem(city_key, aoi)
    is_real_dem = loaded is not None
    if is_real_dem:
        elevation, transform, crs = loaded
    else:
        log.warning(
            "No DEM raster covers %s. Put CartoDEM or SRTM .tif tiles in %s. "
            "Producing a placeholder surface; outputs will be marked is_real_dem=false.",
            aoi["name"], RAW_DEM_DIR,
        )
        elevation, transform, crs = _synthetic_dem(city_key, aoi)

    # NoData: CartoDEM uses large negative sentinels. Fill with the valid mean
    # so the fill does not chase a void across the grid.
    elevation = elevation.astype(np.float32)
    invalid = ~np.isfinite(elevation) | (elevation < -400) | (elevation > 9000)
    if invalid.any():
        valid_mean = float(np.nanmean(elevation[~invalid])) if (~invalid).any() else aoi["fallback_elevation"]
        elevation[invalid] = valid_mean
        log.info("Filled %d nodata cells with the valid mean (%.1f m).", int(invalid.sum()), valid_mean)

    target_epsg = None
    if HAS_RASTERIO and transform is not None:
        elevation, transform, crs, target_epsg = _reproject_to_utm(elevation, transform, crs, aoi)

    if elevation.size > MAX_CELLS:
        factor = int(np.ceil(np.sqrt(elevation.size / MAX_CELLS)))
        elevation = elevation[::factor, ::factor]
        log.warning(
            "Grid exceeded %d cells; decimated by %dx to %s. Effective resolution is now %.0f m.",
            MAX_CELLS, factor, elevation.shape, TARGET_RESOLUTION_M * factor,
        )
        if transform is not None:
            transform = transform * rasterio.Affine.scale(factor, factor)

    cell_size_m = abs(transform.a) if transform is not None else TARGET_RESOLUTION_M

    log.info("Filling depressions (priority-flood) over %s cells...", elevation.shape)
    filled = fill_depressions(elevation)
    depressions = depression_depth(elevation, filled)

    log.info("Computing D8 flow direction and accumulation...")
    direction = d8_flow_direction(filled)
    accumulation = d8_flow_accumulation(direction)
    slope = slope_degrees(filled, cell_size_m)

    if HAS_RASTERIO and transform is not None:
        meta = {
            "driver": "GTiff", "height": filled.shape[0], "width": filled.shape[1],
            "count": 1, "dtype": "float32", "crs": crs, "transform": transform,
            "compress": "deflate",
        }
        layers = {
            f"{city_key}_dem_filled.tif": filled,
            f"{city_key}_slope.tif": slope,
            f"{city_key}_flow_direction.tif": direction,
            f"{city_key}_flow_accumulation.tif": accumulation,
            f"{city_key}_depressions.tif": depressions,
        }
        for filename, grid in layers.items():
            with rasterio.open(output_dir / filename, "w", **meta) as destination:
                destination.write(grid.astype(np.float32), 1)
        log.info("Wrote %d rasters to %s", len(layers), output_dir)

    # Channel threshold: cells draining more than 1 km2 are a drainage line.
    channel_threshold = max(10.0, (1_000_000 / (cell_size_m ** 2)))

    summary = {
        "city": aoi["name"],
        "city_key": city_key,
        "aoi": {key: aoi[key] for key in ("lon_min", "lon_max", "lat_min", "lat_max")},
        "projection": {"epsg": target_epsg, "cell_size_m": round(float(cell_size_m), 2)},
        "dimensions": {"rows": int(filled.shape[0]), "cols": int(filled.shape[1])},
        "elevation_m": {
            "min": float(np.min(filled)), "max": float(np.max(filled)),
            "mean": float(np.mean(filled)), "p10": float(np.percentile(filled, 10)),
        },
        "slope_deg": {"max": float(np.max(slope)), "mean": float(np.mean(slope)),
                      "median": float(np.median(slope))},
        "depressions": {
            "count": int(np.sum(depressions > 0.05)),
            "max_depth_m": float(np.max(depressions)),
            "note": "Cells raised by depression filling. These are where water pools first.",
        },
        "flow_accumulation": {
            "max_cells": float(np.max(accumulation)),
            "channel_threshold_cells": round(channel_threshold, 1),
            "channel_cells": int(np.sum(accumulation >= channel_threshold)),
        },
        "dem_source": {
            "is_real_dem": is_real_dem,
            "label": (
                f"Depression-filled DEM from rasters in {RAW_DEM_DIR.name}, reprojected to EPSG:{target_epsg}"
                if is_real_dem
                else "Placeholder surface. No DEM raster was found; not real terrain."
            ),
            "search_path": str(RAW_DEM_DIR),
        },
        "method": "priority-flood fill, steepest-descent D8, topological flow accumulation",
    }

    summary_path = output_dir / f"{city_key}_dem_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    log.info(
        "%s: mean slope %.2f deg, mean elevation %.1f m, %d depressions, is_real_dem=%s",
        aoi["name"], summary["slope_deg"]["mean"], summary["elevation_m"]["mean"],
        summary["depressions"]["count"], is_real_dem,
    )
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Build terrain layers for a city.")
    parser.add_argument("--city", choices=sorted(CITY_AOIS), help="City to process.")
    parser.add_argument("--all", action="store_true", help="Process every focus city.")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR)
    args = parser.parse_args()

    if not args.city and not args.all:
        parser.error("Pass --city CITY or --all.")

    cities = sorted(CITY_AOIS) if args.all else [args.city]
    for city_key in cities:
        process_city(city_key, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
