"""Read GPM IMERG HDF5 granules into a north-up GeoTIFF stack.

Fixes after review:

* **Latitude orientation.** IMERG stores latitude ascending (south first).
  GeoTIFF rows run north to south. Writing the array without flipping produces
  a vertically mirrored raster, which puts Chennai's coastline on the wrong
  side. The array is now flipped and the result is asserted to be north-up.
* **Run type is reported.** `3B-HHR.MS.MRG` is the Final run, published months
  later. It cannot drive a 0-3 h nowcast and must be described as a hindcast.
  `3B-HHR-E` is the Early run, about 4 h behind real time. The sidecar records
  which one was read and whether it is usable for nowcasting.
* **Units are stated.** IMERG `precipitation` is a rate in mm/hr for the
  half-hour. Summing the rates double-counts: 30 minutes at 10 mm/hr is 5 mm,
  not 10. Nothing here sums them, and the sidecar says so.
* **Domain size is checked.** IMERG cells are 0.1 degrees, roughly 11 km. A
  city-sized box is 3-4 cells across, which is far too small for optical flow
  to find a motion vector. The ingest warns below 40 cells per side.

Usage:
    python -m pipeline.ingest_imerg --input-dir data/raw/imerg \\
        --output-dir data/processed/frames/chennai \\
        --lat-min 10.6 --lat-max 15.6 --lon-min 77.8 --lon-max 82.8
"""
from __future__ import annotations

import argparse
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("ingest_imerg")

IMERG_CELL_DEGREES = 0.1
#: Below this many cells per side, optical flow cannot resolve a motion field.
MIN_CELLS_PER_SIDE = 40

RUN_TYPES = {
    "3B-HHR-E": ("Early", True, "About 4 hours behind real time. Usable for a near-real-time demo."),
    "3B-HHR-L": ("Late", False, "About 14 hours behind real time. Too late to drive a nowcast."),
    "3B-HHR": ("Final", False,
               "Published months after the fact. This is a hindcast dataset: it cannot drive a "
               "0-3 hour nowcast, and any demo built on it must be described as a replay."),
}


def classify_run(filename: str) -> tuple[str, bool, str]:
    for prefix, info in RUN_TYPES.items():
        if filename.startswith(prefix):
            return info
    return ("Unknown", False, "Unrecognised IMERG product; treat timeliness as unknown.")


def _granule_time(name: str) -> str | None:
    match = re.search(r"\.(\d{8})-S(\d{6})-E(\d{6})\.", name)
    if not match:
        return None
    date, start = match.group(1), match.group(2)
    return f"{date[:4]}-{date[4:6]}-{date[6:]}T{start[:2]}:{start[2:4]}:{start[4:]}Z"


def process(input_dir, output_dir, lat_min, lat_max, lon_min, lon_max) -> dict:
    import h5py
    import rasterio
    from rasterio.transform import from_bounds

    input_path, output_path = Path(input_dir), Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    files = sorted(input_path.glob("*.HDF5")) + sorted(input_path.glob("*.hdf5"))
    if not files:
        raise FileNotFoundError(
            f"No IMERG HDF5 granules in {input_path}. Download them from NASA Earthdata "
            f"(GPM_3IMERGHHE for the Early run)."
        )

    run_name, nowcast_capable, timeliness_note = classify_run(files[0].name)
    log.info("IMERG %s run: %s", run_name, timeliness_note)

    span_lat = lat_max - lat_min
    span_lon = lon_max - lon_min
    cells_lat = span_lat / IMERG_CELL_DEGREES
    cells_lon = span_lon / IMERG_CELL_DEGREES
    log.info("Domain %.2f x %.2f degrees = %.0f x %.0f IMERG cells.", span_lat, span_lon, cells_lat, cells_lon)
    if min(cells_lat, cells_lon) < MIN_CELLS_PER_SIDE:
        log.warning(
            "Domain is only %.0f x %.0f cells. Optical flow needs roughly %d per side "
            "(about %.0f degrees, ~500 km) to find a motion vector. Widen the bounding box: "
            "the nowcast is computed over the domain, then sampled at the city.",
            cells_lat, cells_lon, MIN_CELLS_PER_SIDE, MIN_CELLS_PER_SIDE * IMERG_CELL_DEGREES,
        )

    frames, timestamps = [], []
    transform = None
    latitudes = longitudes = None

    for granule in files:
        with h5py.File(granule, "r") as handle:
            latitude = handle["/Grid/lat"][:]
            longitude = handle["/Grid/lon"][:]
            key = "/Grid/precipitation" if "/Grid/precipitation" in handle else "/Grid/precipitationCal"
            # IMERG arrays are [time, lon, lat].
            precipitation = handle[key][0]

            if transform is None:
                lat_index = np.nonzero((latitude >= lat_min) & (latitude <= lat_max))[0]
                lon_index = np.nonzero((longitude >= lon_min) & (longitude <= lon_max))[0]
                if lat_index.size == 0 or lon_index.size == 0:
                    raise ValueError("The requested bounding box does not intersect the IMERG grid.")
                lat_slice = slice(lat_index[0], lat_index[-1] + 1)
                lon_slice = slice(lon_index[0], lon_index[-1] + 1)
                latitudes = latitude[lat_slice]
                longitudes = longitude[lon_slice]
                transform = from_bounds(
                    float(longitudes.min()), float(latitudes.min()),
                    float(longitudes.max()), float(latitudes.max()),
                    len(longitudes), len(latitudes),
                )

            # [lon, lat] -> [lat, lon]
            window = precipitation[lon_slice, lat_slice].T.astype(np.float32)

            # IMERG latitude ascends (south first); a GeoTIFF's first row is the
            # northernmost. Without this flip the raster comes out mirrored.
            if latitudes[0] < latitudes[-1]:
                window = np.flipud(window)

            # Negative values are IMERG's nodata sentinels.
            window[window < 0] = 0.0

            frames.append(window)
            timestamps.append(_granule_time(granule.name) or granule.stem)

    stack = np.stack(frames)
    log.info("Stacked %d granules: %s", stack.shape[0], stack.shape)

    with rasterio.open(
        output_path / "forecast.tif", "w", driver="GTiff",
        height=stack.shape[1], width=stack.shape[2], count=stack.shape[0],
        dtype="float32", crs="EPSG:4326", transform=transform, compress="deflate",
    ) as destination:
        destination.write(stack)

    # A north-up raster has a negative north-south pixel size.
    assert transform.e < 0, "Raster is not north-up; the latitude flip did not apply."

    metadata = {
        "produced_at": datetime.now(timezone.utc).isoformat(),
        "granules": len(files),
        "run_type": run_name,
        "suitable_for_nowcasting": nowcast_capable,
        "timeliness": timeliness_note,
        "timestamps_utc": timestamps,
        "timestep_minutes": 30,
        "units": "mm/hr",
        "units_note": (
            "Each band is a rain RATE in mm/hr over a 30-minute window. Depth for one "
            "band is rate * 0.5 hours. Summing the bands as if they were depths doubles "
            "the total."
        ),
        "bbox": {"lat_min": lat_min, "lat_max": lat_max, "lon_min": lon_min, "lon_max": lon_max},
        "grid": {
            "rows": int(stack.shape[1]), "cols": int(stack.shape[2]),
            "cell_degrees": IMERG_CELL_DEGREES,
            "approx_cell_km": 11.1,
            "wide_enough_for_optical_flow": bool(min(cells_lat, cells_lon) >= MIN_CELLS_PER_SIDE),
        },
        "orientation": "north-up (latitude descending by row)",
    }
    (output_path / "forecast.meta.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    log.info("Wrote %s and its sidecar.", output_path / "forecast.tif")
    return metadata


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest GPM IMERG granules into a GeoTIFF stack.")
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--lat-min", type=float, required=True)
    parser.add_argument("--lat-max", type=float, required=True)
    parser.add_argument("--lon-min", type=float, required=True)
    parser.add_argument("--lon-max", type=float, required=True)
    args = parser.parse_args()

    process(args.input_dir, args.output_dir, args.lat_min, args.lat_max, args.lon_min, args.lon_max)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
