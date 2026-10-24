"""
Download IMERG granules from a GES DISC URL list, resumably.

Authentication
--------------
Earthdata Login is required. Create a ~/.netrc (Windows: %USERPROFILE%/.netrc)
containing ONE line:

    machine urs.earthdata.nasa.gov login YOUR_USERNAME password YOUR_PASSWORD

Then restrict it:  icacls "%USERPROFILE%\\.netrc" /inheritance:r /grant:r "%USERNAME%:R"

This script never reads, prints or transmits those credentials; curl handles them.

Disk
----
A full season of global granules is ~35 GB. --crop-to extracts the nowcast domain
from each day and deletes the raw granules, so peak disk stays around one day
(~350 MB) and the kept output is a few hundred MB.

Keep --dest OUTSIDE any cloud-synced folder (OneDrive, Dropbox). Granules are
transient bulk data and syncing them wastes quota and bandwidth.

Examples
--------
    # disk-light: keep only the 8 degree Chennai domain, discard raw granules
    python pipeline/download_imerg.py --urls links.txt --dest D:/imerg_tmp \\
        --crop-to data/processed/nowcast/chennai \\
        --center 13.08 80.27 --domain-deg 8

    # keep everything (needs ~35 GB)
    python pipeline/download_imerg.py --urls links.txt --dest D:/imerg_raw --keep-raw
"""
import argparse
import collections
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Must match what ingest_imerg globs (Final run). Early/Late granules ("3B-HHR-E",
# "3B-HHR-L") would download, then fail every crop and leave all raw data on disk.
GRANULE_RE = re.compile(r"3B-HHR\.MS\.MRG\.3IMERG\.(\d{8})-S(\d{6})")


def parse_urls(url_file):
    """Return {date_str: [urls]} for HDF5 granules only, in time order."""
    by_day = collections.defaultdict(list)
    skipped = 0
    for line in Path(url_file).read_text().splitlines():
        line = line.strip()
        if not line or not line.endswith(".HDF5"):
            skipped += 1
            continue
        m = GRANULE_RE.search(line)
        if not m:
            skipped += 1
            continue
        by_day[m.group(1)].append((m.group(2), line))
    for day in by_day:
        by_day[day] = [u for _, u in sorted(by_day[day])]
    return dict(sorted(by_day.items())), skipped


PLACEHOLDER_MARKERS = ("REPLACE_WITH", "YOUR_USERNAME", "YOUR_PASSWORD")


def netrc_status():
    """
    ('ok', path) | ('placeholder', path) | ('no-machine', path) | ('missing', None)

    An unedited template would otherwise pass a bare existence check and fail later
    as an unexplained HTML login page, which is a much harder error to diagnose.
    """
    for name in (".netrc", "_netrc"):
        path = Path.home() / name
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return "missing", None
        if any(marker in text for marker in PLACEHOLDER_MARKERS):
            return "placeholder", path
        if "urs.earthdata.nasa.gov" not in text:
            return "no-machine", path
        return "ok", path
    return "missing", None


def fetch(url, dest_dir, cookie_jar, timeout=180):
    """Download one granule with curl. Returns the path, or None on failure."""
    out = dest_dir / url.rsplit("/", 1)[-1]
    if out.is_file():
        return out                      # only ever created by a completed rename below
    # Download to .part and rename on success. A transfer killed mid-way (Ctrl-C,
    # power loss) previously left a truncated file under the final name, which the
    # next run skipped as already downloaded and h5py later failed to open.
    part = out.with_name(out.name + ".part")

    cmd = [
        "curl", "-sS", "-L", "-f",
        "--netrc",
        "-b", str(cookie_jar), "-c", str(cookie_jar),
        "--retry", "3", "--retry-delay", "2",
        "--max-time", str(timeout),
        "-o", str(part),
        url,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        part.unlink(missing_ok=True)
        err = (res.stderr or "").strip().splitlines()
        print(f"    FAILED {out.name}: {err[-1] if err else 'curl exit ' + str(res.returncode)}")
        return None
    size = part.stat().st_size
    if size < 1024:
        # Earthdata returns a small HTML login page when auth fails.
        part.unlink()
        print(f"    FAILED {out.name}: got {size} bytes, looks like a login page.")
        print("           Check ~/.netrc and that GESDISC DATA ARCHIVE is an authorized app.")
        return None
    part.replace(out)
    return out


def crop_day(day_dir, out_file, center, domain_deg):
    """
    Crop one day's granules to the nowcast domain and write a multiband GeoTIFF.

    `day_dir` holds only that day's granules, so ingest can read it directly.
    """
    from pipeline.ingest_imerg import process

    lat_c, lon_c = center
    half = domain_deg / 2.0
    work = day_dir / "_out"
    process(str(day_dir), str(work), lat_c - half, lat_c + half, lon_c - half, lon_c + half,
            domain_deg=domain_deg)

    out_file.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(work / "forecast.tif"), str(out_file))
    # Keep the frame timestamps beside the day's raster. Without them validation
    # cannot tell whether consecutive bands are really one timestep apart.
    shutil.move(str(work / "frames.json"), str(out_file.with_suffix(".frames.json")))
    shutil.rmtree(work, ignore_errors=True)
    return out_file


def stack_days(crop_dir, out_dir):
    """
    Concatenate per-day cropped rasters into one multiband forecast.tif plus a merged
    frames.json, the layout nowcast_pysteps and validate_nowcast read.

    Days are joined in date order; gaps between days stay visible in frames.json, so
    validation still refuses to score across them.
    """
    import json
    import numpy as np
    import rasterio

    days = sorted(Path(crop_dir).glob("imerg_*.tif"))
    if not days:
        raise FileNotFoundError(f"No imerg_*.tif files in {crop_dir}")

    stacks, times, profile, transform = [], [], None, None
    for tif in days:
        side = tif.with_suffix(".frames.json")
        if not side.is_file():
            raise FileNotFoundError(f"{side.name} missing; re-crop {tif.name} to recover its timestamps")
        with rasterio.open(tif) as src:
            if transform is None:
                profile, transform = src.profile.copy(), src.transform
            elif src.transform != transform or (src.height, src.width) != (profile["height"], profile["width"]):
                raise ValueError(f"{tif.name} has a different grid; all days must share one domain")
            stacks.append(src.read())
        times += json.loads(side.read_text())["frame_times"]

    data = np.concatenate(stacks, axis=0)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    profile.update(count=data.shape[0])
    with rasterio.open(out / "forecast.tif", "w", **profile) as dst:
        dst.write(data)
    (out / "frames.json").write_text(json.dumps(
        {"count": len(times), "timestep_minutes": 30, "frame_times": times}, indent=2))
    print(f"stacked {len(days)} days -> {data.shape[0]} frames of {data.shape[1]}x{data.shape[2]} in {out}")
    return out / "forecast.tif"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--urls", required=True, help="GES DISC subset .txt link list")
    ap.add_argument("--dest", required=True, help="where granules are downloaded (keep OUT of OneDrive)")
    ap.add_argument("--crop-to", help="write one cropped GeoTIFF per day here, then delete the granules")
    ap.add_argument("--center", nargs=2, type=float, metavar=("LAT", "LON"),
                    help="domain centre, required with --crop-to")
    ap.add_argument("--domain-deg", type=float, default=8.0, help="domain width in degrees (default 8)")
    ap.add_argument("--keep-raw", action="store_true", help="do not delete granules after cropping")
    ap.add_argument("--limit-days", type=int, help="stop after N days (useful for a first test)")
    ap.add_argument("--stack-to", help="after cropping, stack all days in --crop-to into one "
                                       "forecast.tif + frames.json here (input for validation)")
    args = ap.parse_args()

    if args.crop_to and not args.center:
        ap.error("--crop-to requires --center LAT LON")

    status, netrc_path = netrc_status()
    if status != "ok":
        line = "machine urs.earthdata.nasa.gov login <username> password <password>"
        if status == "placeholder":
            print(f"ERROR: {netrc_path} still contains template placeholders.")
            print("Replace them with your real Earthdata Login credentials:")
        elif status == "no-machine":
            print(f"ERROR: {netrc_path} has no entry for urs.earthdata.nasa.gov.")
            print("Add this line:")
        else:
            print("ERROR: no ~/.netrc found. Earthdata Login is required.")
            print("Create it with one line:")
        print(f"    {line}")
        print("\nRegister free at https://urs.earthdata.nasa.gov and accept the GES DISC EULA.")
        return 1

    by_day, skipped = parse_urls(args.urls)
    days = list(by_day)[: args.limit_days] if args.limit_days else list(by_day)
    total = sum(len(by_day[d]) for d in days)
    print(f"{len(by_day)} days in list ({skipped} non-granule lines ignored)")
    print(f"processing {len(days)} day(s), {total} granules\n")

    dest = Path(args.dest)
    dest.mkdir(parents=True, exist_ok=True)
    cookie_jar = dest / ".urs_cookies"

    ok = failed = 0
    for i, day in enumerate(days, 1):
        urls = by_day[day]
        if args.crop_to:
            out_file = Path(args.crop_to) / f"imerg_{day}.tif"
            if out_file.is_file():
                print(f"[{i}/{len(days)}] {day}  already cropped, skipping")
                continue

        print(f"[{i}/{len(days)}] {day}  {len(urls)} granules")
        day_dir = dest / day
        day_dir.mkdir(exist_ok=True)

        got = []
        for u in urls:
            p = fetch(u, day_dir, cookie_jar)
            if p:
                got.append(p)
                ok += 1
            else:
                failed += 1

        if not got:
            print("    no granules retrieved; stopping so the problem is visible")
            return 1

        if args.crop_to:
            try:
                out = crop_day(day_dir, out_file, tuple(args.center), args.domain_deg)
                size_mb = out.stat().st_size / 1048576
                raw_mb = sum(g.stat().st_size for g in got) / 1048576
                print(f"    cropped -> {out.name}  {size_mb:.1f} MB "
                      f"(from {raw_mb:.0f} MB of granules, {raw_mb/size_mb:.0f}x smaller)")
                if not args.keep_raw:
                    shutil.rmtree(day_dir, ignore_errors=True)
                    print(f"    deleted {len(got)} raw granules")
            except Exception as exc:
                print(f"    CROP FAILED for {day}: {type(exc).__name__}: {exc}")
                print("    raw granules kept so nothing is lost")
                failed += 1

    print(f"\ndone: {ok} granules downloaded, {failed} failures")
    if args.stack_to and args.crop_to and failed == 0:
        stack_days(args.crop_to, args.stack_to)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    raise SystemExit(main())
