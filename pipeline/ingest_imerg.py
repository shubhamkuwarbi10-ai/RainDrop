import argparse
import json
import re
from datetime import datetime
from pathlib import Path

import h5py
import numpy as np
import rasterio
from rasterio.transform import from_bounds

def expand_to_domain(lat_min, lat_max, lon_min, lon_max, domain_deg):
    """
    Widen a bbox so it is at least `domain_deg` across, keeping the same centre.

    A city AOI is a few tenths of a degree, which is far too small to run optical
    flow on. The nowcast needs the upwind region that will advect into the city,
    so ingest a wide domain and sample the city out of the forecast afterwards.
    """
    if not domain_deg:
        return lat_min, lat_max, lon_min, lon_max

    lat_c, lon_c = (lat_min + lat_max) / 2.0, (lon_min + lon_max) / 2.0
    half = domain_deg / 2.0
    return (
        max(-89.95, min(lat_min, lat_c - half)),
        min(89.95, max(lat_max, lat_c + half)),
        max(-179.95, min(lon_min, lon_c - half)),
        min(179.95, max(lon_max, lon_c + half)),
    )


def process(in_dir, out_dir, lat_min, lat_max, lon_min, lon_max, domain_deg=None):
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    lat_min, lat_max, lon_min, lon_max = expand_to_domain(
        lat_min, lat_max, lon_min, lon_max, domain_deg
    )
    if domain_deg:
        print(f"Nowcast domain: lat {lat_min:.2f}..{lat_max:.2f}  lon {lon_min:.2f}..{lon_max:.2f}")

    files = sorted(Path(in_dir).glob("3B-HHR.MS.MRG.3IMERG.*.HDF5"))
    if not files:
        raise FileNotFoundError("No HDF5 files found")

    series, stamps = [], []
    for f in files:
        with h5py.File(f, 'r') as h:
            lat, lon = h['/Grid/lat'][:], h['/Grid/lon'][:]
            precip_key = '/Grid/precipitation' if '/Grid/precipitation' in h else '/Grid/precipitationCal'

            if not series:
                # Find indices once
                lati = np.where((lat >= lat_min) & (lat <= lat_max))[0]
                loni = np.where((lon >= lon_min) & (lon <= lon_max))[0]
                if not len(lati) or not len(loni):
                    raise ValueError("BBox out of bounds")
                ls, lns = slice(lati[0], lati[-1]+1), slice(loni[0], loni[-1]+1)

                clon, clat = lon[lns], lat[ls]
                # lat/lon arrays hold pixel CENTRES, so the raster extent runs half a
                # pixel beyond them on each side. Using the centres as bounds shrinks
                # the grid and reports the wrong pixel size.
                half_lat = float(np.abs(np.diff(lat)).mean()) / 2.0
                half_lon = float(np.abs(np.diff(lon)).mean()) / 2.0
                transform = from_bounds(
                    clon.min() - half_lon, clat.min() - half_lat,
                    clon.max() + half_lon, clat.max() + half_lat,
                    len(clon), len(clat),
                )

            # Slice inside the index so h5py reads only the window. Reading the whole
            # global array first (`h[key][0]`, 24.7 MB) and cropping afterwards was
            # ~23x slower for the same result.
            p = h[precip_key][0, lns, ls].T
            # IMERG /Grid/lat ascends south -> north, so row 0 is the SOUTHERNMOST
            # latitude. from_bounds above builds a north-up transform (row 0 = north),
            # so the rows must be reversed or every frame comes out mirrored.
            if lat[0] < lat[-1]:
                p = p[::-1, :]
            p[p < 0] = 0.0
            series.append(p)
            stamps.append(f.stem)

    stacked = np.stack(series)
    
    # Export GeoTIFF
    with rasterio.open(
        out_path / "forecast.tif", 'w', driver='GTiff',
        height=stacked.shape[1], width=stacked.shape[2], count=stacked.shape[0],
        dtype=stacked.dtype, crs='EPSG:4326', transform=transform
    ) as dst:
        dst.write(stacked)
        
    # Frame timestamps, so downstream steps can tell whether consecutive bands are
    # really one timestep apart. Advecting across a missing slot as if it were 30 min
    # silently corrupts any skill score computed from it.
    frame_times = []
    for s in stamps:
        m = re.search(r"3IMERG\.(\d{8})-S(\d{6})", s)
        frame_times.append(
            datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S").isoformat() if m else None
        )
    (out_path / "frames.json").write_text(json.dumps({
        "count": len(frame_times),
        "timestep_minutes": 30,
        "frame_times": frame_times,
    }, indent=2))

    # Export JSON payload
    (out_path / "payload.json").write_text(json.dumps({
        "timestamp": stamps[-1],
        "bbox": [lat_min, lat_max, lon_min, lon_max],
        "resolution": [(lat_max - lat_min)/len(clat), (lon_max - lon_min)/len(clon)],
        "data": stacked[-1].flatten().tolist()
    }))
    print(f"Processed {len(files)} files.")

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Step 1: crop IMERG granules to a nowcast domain")
    for a in ("--input-dir", "--output-dir", "--lat-min", "--lat-max", "--lon-min", "--lon-max"):
        p.add_argument(a, type=float if "dir" not in a else str, required=True)
    p.add_argument(
        "--domain-deg", type=float, default=8.0,
        help="Widen the bbox to at least this many degrees for optical flow (default: 8). "
             "Pass 0 to use the bbox exactly as given.",
    )
    args = p.parse_args()
    process(args.input_dir, args.output_dir, args.lat_min, args.lat_max,
            args.lon_min, args.lon_max, args.domain_deg)
