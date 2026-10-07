"""
Report whether the DEM tiles and IMERG granules on disk actually cover each city AOI.

Run this after dropping new files into data/raw/ and before running the pipeline:

    python pipeline/check_data_coverage.py

It answers two questions the pipeline used to get wrong silently:
  1. Does any DEM tile genuinely overlap the AOI? (an adjacent tile contributes
     nothing, but used to be accepted and stretched over the city)
  2. Which IMERG half-hourly slots are present, and which are missing?
"""
import math
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from pipeline.process_dem import CITY_AOIS, _overlaps_aoi

DEM_DIR = ROOT / "data" / "raw" / "cartodem"
IMERG_DIR = ROOT / "data" / "raw" / "imerg"


def required_cells(cfg):
    """The 1x1 degree cells an AOI touches."""
    return [
        (x, y)
        for x in range(math.floor(cfg["lon_min"]), math.ceil(cfg["lon_max"]))
        for y in range(math.floor(cfg["lat_min"]), math.ceil(cfg["lat_max"]))
    ]


def check_dem():
    print("=" * 72)
    print("DEM COVERAGE")
    print("=" * 72)

    try:
        import rasterio
    except ImportError:
        print("  rasterio not installed; skipping DEM check")
        return False

    if not DEM_DIR.exists():
        print(f"  {DEM_DIR} does not exist")
        return False

    tiles = []
    for f in sorted(DEM_DIR.glob("*.tif")):
        try:
            with rasterio.open(f) as src:
                tiles.append((f.name, src.bounds))
        except Exception as exc:
            print(f"  could not read {f.name}: {exc}")

    print(f"  {len(tiles)} tile(s) in {DEM_DIR.relative_to(ROOT)}\n")

    all_ok = True
    for cfg in CITY_AOIS.values():
        matches = [
            name for name, b in tiles
            if _overlaps_aoi(b, cfg["lon_min"], cfg["lon_max"], cfg["lat_min"], cfg["lat_max"])
        ]
        ok = bool(matches)
        all_ok &= ok
        flag = "OK " if ok else "GAP"
        print(f"  [{flag}] {cfg['name']:<8} AOI lon {cfg['lon_min']}..{cfg['lon_max']} "
              f"lat {cfg['lat_min']}..{cfg['lat_max']}")
        if matches:
            for m in matches:
                print(f"           overlapping tile: {m}")
        else:
            print("           no overlapping tile -> will fall back to synthetic terrain")
            for x, y in required_cells(cfg):
                print(f"           need a tile covering lon {x}..{x+1}  lat {y}..{y+1}")
        print()

    return all_ok


def check_imerg():
    print("=" * 72)
    print("IMERG COVERAGE")
    print("=" * 72)

    if not IMERG_DIR.exists():
        print(f"  {IMERG_DIR} does not exist")
        return False

    files = sorted(IMERG_DIR.glob("3B-HHR*.HDF5"))
    print(f"  {len(files)} granule(s) in {IMERG_DIR.relative_to(ROOT)}")
    if not files:
        return False

    # 3B-HHR.MS.MRG.3IMERG.20250620-S000000-E002959.0000.V07B.HDF5
    stamps = []
    for f in files:
        try:
            part = f.name.split(".3IMERG.")[1]
            day, start = part.split("-")[0], part.split("-S")[1][:6]
            stamps.append(datetime.strptime(day + start, "%Y%m%d%H%M%S"))
        except (IndexError, ValueError):
            print(f"  unparseable filename: {f.name}")

    if not stamps:
        return False

    stamps.sort()
    print(f"  range: {stamps[0]:%Y-%m-%d %H:%M} .. {stamps[-1]:%Y-%m-%d %H:%M}")

    by_day = defaultdict(int)
    for s in stamps:
        by_day[s.date()] += 1

    span_days = (stamps[-1].date() - stamps[0].date()).days + 1
    full_days = sum(1 for n in by_day.values() if n == 48)
    print(f"  days with data: {len(by_day)} of {span_days} in range")
    print(f"  complete days (48/48 half-hourly slots): {full_days}")

    partial = sorted((d, n) for d, n in by_day.items() if n != 48)
    if partial:
        print(f"  incomplete days: {len(partial)}")
        for d, n in partial[:10]:
            print(f"    {d}  {n}/48 slots")
        if len(partial) > 10:
            print(f"    ... and {len(partial) - 10} more")

    missing_days = [
        stamps[0].date() + timedelta(days=i)
        for i in range(span_days)
        if (stamps[0].date() + timedelta(days=i)) not in by_day
    ]
    if missing_days:
        print(f"  days entirely missing: {len(missing_days)}")
        for d in missing_days[:10]:
            print(f"    {d}")
        if len(missing_days) > 10:
            print(f"    ... and {len(missing_days) - 10} more")

    print("\n  Validation needs consecutive granules: a forecast launched at time t is")
    print("  scored against the observed granule at t+30/60/90 min, so gaps reduce the")
    print("  number of usable forecast-observation pairs.")
    return full_days > 0


if __name__ == "__main__":
    dem_ok = check_dem()
    print()
    imerg_ok = check_imerg()
    print()
    print("=" * 72)
    print(f"DEM covers all cities : {'yes' if dem_ok else 'NO'}")
    print(f"IMERG usable          : {'yes' if imerg_ok else 'NO'}")
    print("=" * 72)
