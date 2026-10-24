"""
Download IMERG granules through Brave, using its logged-in Earthdata session.

Use this when ~/.netrc is not set up (download_imerg.py needs it). Links are opened
in Brave a batch at a time; finished files are moved out of Downloads into
DEST/<day>/, and each complete day is cropped with download_imerg.crop_day and its
raw granules deleted. Resumable: cropped days and already-moved granules are skipped.

    python pipeline/download_imerg_browser.py --urls "dataset/IMERG files/links_remaining.txt" \\
        --dest C:/Users/Tpaha/imerg_tmp --crop-to "dataset/IMERG india" \\
        --center 21.75 82.75 --domain-deg 31.5

Files that still haven't arrived after one retry are skipped and listed in DEST/skipped.txt;
their day is cropped without them, so its frames.json shows the gap. If a whole batch
fails, Brave has probably lost the Earthdata login: open https://urs.earthdata.nasa.gov
in Brave, sign in, and rerun the same command.
"""
import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.download_imerg import crop_day, parse_urls

BRAVE = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
DOWNLOADS = Path.home() / "Downloads"


def fetch_batch(urls, day_dir, brave, timeout):
    """Open urls in Brave and move each finished file into day_dir. Returns names still missing."""
    names = [u.rsplit("/", 1)[-1] for u in urls]
    subprocess.Popen([brave, *urls], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + timeout
    pending = set(names)
    while pending and time.time() < deadline:
        time.sleep(3)
        for name in list(pending):
            # Chromium only renames to the final name once complete. A re-opened link whose
            # earlier attempt is still stuck as .crdownload arrives as "name (1).HDF5".
            for f in [DOWNLOADS / name, *DOWNLOADS.glob(name[:-5] + " (*).HDF5")]:
                if f.is_file() and f.stat().st_size > 1024:
                    shutil.move(str(f), str(day_dir / name))
                    pending.discard(name)
                    break
    return pending


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--urls", required=True)
    ap.add_argument("--dest", required=True, help="per-day raw granule folders (keep OUT of OneDrive)")
    ap.add_argument("--crop-to", required=True)
    ap.add_argument("--center", nargs=2, type=float, required=True, metavar=("LAT", "LON"))
    ap.add_argument("--domain-deg", type=float, default=8.0)
    ap.add_argument("--batch", type=int, default=24, help="links opened in Brave at once")
    ap.add_argument("--timeout", type=int, default=300, help="seconds to wait for one batch")
    ap.add_argument("--brave", default=BRAVE)
    args = ap.parse_args()

    by_day, _ = parse_urls(args.urls)
    print(f"{len(by_day)} days, {sum(map(len, by_day.values()))} granules in list", flush=True)

    for i, (day, urls) in enumerate(by_day.items(), 1):
        out_file = Path(args.crop_to) / f"imerg_{day}.tif"
        if out_file.is_file():
            continue
        day_dir = Path(args.dest) / day
        day_dir.mkdir(parents=True, exist_ok=True)
        todo = [u for u in urls if not (day_dir / u.rsplit("/", 1)[-1]).is_file()]
        print(f"[{i}/{len(by_day)}] {day}  {len(todo)} to download", flush=True)

        for k in range(0, len(todo), args.batch):
            batch = todo[k:k + args.batch]
            missing = fetch_batch(batch, day_dir, args.brave, args.timeout)
            if missing:
                # Brave occasionally drops a download without a trace; reopen those links once.
                retry = [u for u in batch if u.rsplit("/", 1)[-1] in missing]
                missing = fetch_batch(retry, day_dir, args.brave, args.timeout)
            if missing and len(missing) == len(batch):
                # Nothing at all arrived: almost always an expired login, so skipping would
                # silently drop whole days.
                print("    no files arrived for a whole batch. Sign in to Earthdata in Brave, then rerun.")
                return 1
            if missing:
                skipped = [u for u in batch if u.rsplit("/", 1)[-1] in missing]
                with open(Path(args.dest) / "skipped.txt", "a") as f:
                    f.write("\n".join(skipped) + "\n")
                print(f"    skipped {len(skipped)} file(s) that never arrived (logged in skipped.txt)", flush=True)

        n = len(list(day_dir.glob("*.HDF5")))
        out = crop_day(day_dir, out_file, tuple(args.center), args.domain_deg)
        shutil.rmtree(day_dir)
        print(f"    {n} granules -> {out.name}, raw deleted", flush=True)

    print("all days done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
