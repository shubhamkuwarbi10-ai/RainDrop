"""
Regression tests for the geospatial fixes.

Covers:
  - IMERG rasters are north-up (rows were previously mirrored about the AOI mid-latitude)
  - IMERG pixel size matches the source (bounds were built from pixel centres)

Run:  python tests/test_georeferencing.py
"""
import glob
import sys
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

def test_imerg_raster_is_north_up():
    """Runs only when real granules are present."""
    # Same pattern ingest_imerg uses, so band N maps to granule N. A bare "*.HDF5"
    # would also pick up Early/Late or partial files and misalign the comparison.
    granules = sorted(glob.glob(str(ROOT / "data" / "raw" / "imerg" / "3B-HHR.MS.MRG.3IMERG.*.HDF5")))
    if not granules:
        print("skip  test_imerg_raster_is_north_up (no granules in data/raw/imerg)")
        return

    import h5py
    import rasterio
    from pipeline.ingest_imerg import process

    out = tempfile.mkdtemp(prefix="imerg_test_")
    process(str(ROOT / "data" / "raw" / "imerg"), out, 12.80, 13.30, 80.00, 80.50)

    with h5py.File(granules[0], "r") as h:
        lat, lon = h["/Grid/lat"][:], h["/Grid/lon"][:]
    res_lat = float(np.abs(np.diff(lat)).mean())
    res_lon = float(np.abs(np.diff(lon)).mean())

    with rasterio.open(Path(out) / "forecast.tif") as ds:
        px_w, px_h = ds.res
        # 1e-4 deg is ~11 m: loose enough for float32 rounding in the lat/lon arrays
        # (~0.2 m in practice), tight enough to catch the original defect, which
        # produced 0.075 deg instead of 0.1 -- four orders of magnitude bigger.
        assert abs(px_w - res_lon) < 1e-4, f"lon pixel {px_w} != source {res_lon}"
        assert abs(px_h - res_lat) < 1e-4, f"lat pixel {px_h} != source {res_lat}"

        # Pick the band with the strongest north-south contrast so a flip is detectable.
        best, contrast = None, -1.0
        for b in range(1, ds.count + 1):
            a = ds.read(b)
            d = abs(float(a[0, :].mean()) - float(a[-1, :].mean()))
            if d > contrast:
                best, contrast = b, d
        assert contrast > 0.1, "no band has north-south contrast; test would be vacuous"

        arr = ds.read(best)
        with h5py.File(granules[best - 1], "r") as h:
            key = "/Grid/precipitation" if "/Grid/precipitation" in h else "/Grid/precipitationCal"
            precip = h[key][0]

        for r in range(ds.height):
            for c in range(ds.width):
                lo, la = ds.xy(r, c)
                want = max(float(precip[int(np.argmin(np.abs(lon - lo))),
                                        int(np.argmin(np.abs(lat - la)))]), 0.0)
                assert abs(float(arr[r, c]) - want) < 1e-4, (
                    f"cell ({r},{c}) at lat {la:.2f} lon {lo:.2f}: "
                    f"raster {arr[r, c]} != source {want} -- raster is misregistered"
                )


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all checks passed")
