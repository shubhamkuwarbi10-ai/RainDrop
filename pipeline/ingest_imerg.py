import argparse
import json
import h5py
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from pathlib import Path

def process(in_dir, out_dir, lat_min, lat_max, lon_min, lon_max):
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    files = sorted(Path(in_dir).glob("3B-HHR.MS.MRG.3IMERG.*.HDF5"))
    if not files:
        raise FileNotFoundError("No HDF5 files found")

    series, stamps = [], []
    for f in files:
        with h5py.File(f, 'r') as h:
            lat, lon = h['/Grid/lat'][:], h['/Grid/lon'][:]
            precip_key = '/Grid/precipitation' if '/Grid/precipitation' in h else '/Grid/precipitationCal'
            precip = h[precip_key][0]

            if not series:
                # Find indices once
                lati = np.where((lat >= lat_min) & (lat <= lat_max))[0]
                loni = np.where((lon >= lon_min) & (lon <= lon_max))[0]
                if not len(lati) or not len(loni):
                    raise ValueError("BBox out of bounds")
                ls, lns = slice(lati[0], lati[-1]+1), slice(loni[0], loni[-1]+1)
                
                clon, clat = lon[lns], lat[ls]
                transform = from_bounds(clon.min(), clat.min(), clon.max(), clat.max(), len(clon), len(clat))

            # Crop, transpose to [lat, lon], impute < 0 to 0.0
            p = precip[lns, ls].T
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
        
    # Export JSON payload
    (out_path / "payload.json").write_text(json.dumps({
        "timestamp": stamps[-1],
        "bbox": [lat_min, lat_max, lon_min, lon_max],
        "resolution": [(lat_max - lat_min)/len(clat), (lon_max - lon_min)/len(clon)],
        "data": stacked[-1].flatten().tolist()
    }))
    print(f"Processed {len(files)} files.")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    for a in ("--input-dir", "--output-dir", "--lat-min", "--lat-max", "--lon-min", "--lon-max"):
        p.add_argument(a, type=float if "dir" not in a else str, required=True)
    args = p.parse_args()
    process(args.input_dir, args.output_dir, args.lat_min, args.lat_max, args.lon_min, args.lon_max)
