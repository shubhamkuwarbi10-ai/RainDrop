"""Preflight check for a RainDrop Python environment.

Run this on any machine before trusting it to run the app or the pipeline. It
reports what works, what is missing, and what that costs you, then exits
non-zero if the core is unusable.

    python tools/check_env.py              # check this interpreter
    python tools/check_env.py --wheels     # also verify every pin has a binary
                                           # wheel on all supported platforms
                                           # (needs network; used in CI)

Exit codes
    0  core is usable (optional extras may be missing)
    1  core is broken: the API or pipeline will not run here
"""
from __future__ import annotations

import argparse
import importlib
import importlib.metadata as md
import json
import platform
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MIN_PY = (3, 11)
MAX_PY_TESTED = (3, 14)

# import name -> distribution name, for the core set.
CORE = {
    "numpy": "numpy",
    "scipy": "scipy",
    "h5py": "h5py",
    "rasterio": "rasterio",
    "sklearn": "scikit-learn",
    "fastapi": "fastapi",
    "pydantic": "pydantic",
    "uvicorn": "uvicorn",
    "sqlalchemy": "SQLAlchemy",
    "geoalchemy2": "GeoAlchemy2",
    "psycopg2": "psycopg2-binary",
    "dotenv": "python-dotenv",
}

# Optional extras: import name -> (distribution, what you lose without it)
OPTIONAL = {
    "pysteps": ("pysteps", "the rainfall nowcast (pipeline/nowcast_pysteps.py) cannot run"),
    "cv2": ("opencv-python-headless", "pysteps optical flow fails at runtime inside dense_lucaskanade"),
    "pyswmm": ("pyswmm", "SWMM label generation (models/swmm_labels.py) cannot run"),
    "pysheds": ("pysheds", "process_dem falls back to a slower built-in depression fill"),
}

GREEN, RED, YELLOW, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[0m"
if not sys.stdout.isatty():
    GREEN = RED = YELLOW = RESET = ""


def ok(msg):
    print(f"  {GREEN}ok{RESET}      {msg}")


def bad(msg):
    print(f"  {RED}FAIL{RESET}    {msg}")


def warn(msg):
    print(f"  {YELLOW}warn{RESET}    {msg}")


def parse_pins(path):
    pins = {}
    if not path.is_file():
        return pins
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#")[0].strip()
        m = re.match(r"^([A-Za-z0-9_.\-]+)\s*==\s*([A-Za-z0-9_.\-+]+)$", line)
        if m:
            pins[m.group(1).lower()] = m.group(2)
    return pins


def check_python():
    print("\nPython")
    v = sys.version_info
    cur = f"{v.major}.{v.minor}.{v.micro}"
    print(f"  interpreter   {sys.executable}")
    print(f"  platform      {platform.system()} {platform.machine()}")
    if (v.major, v.minor) < MIN_PY:
        bad(f"Python {cur}: too old. numpy, pandas, scipy and scikit-learn publish "
            f"no wheel below {MIN_PY[0]}.{MIN_PY[1]}, so pip install will fail here.")
        return False
    if (v.major, v.minor) > MAX_PY_TESTED:
        warn(f"Python {cur} is newer than the tested maximum "
             f"{MAX_PY_TESTED[0]}.{MAX_PY_TESTED[1]}; wheels may not exist yet.")
        return True
    ok(f"Python {cur} is within the supported range "
       f"{MIN_PY[0]}.{MIN_PY[1]} - {MAX_PY_TESTED[0]}.{MAX_PY_TESTED[1]}")
    return True


def check_imports(pins):
    print("\nCore dependencies (the API and pipeline need all of these)")
    healthy = True
    for mod, dist in CORE.items():
        try:
            importlib.import_module(mod)
        except Exception as e:  # ImportError, OSError from a blocked DLL, anything
            healthy = False
            detail = str(e).strip().splitlines()[0] if str(e) else type(e).__name__
            bad(f"{dist:<18} import failed: {detail}")
            if "Application Control" in str(e) or "DLL load failed" in str(e):
                print("            -> the OS blocked this package's native library. "
                      "Use Docker on this machine.")
            continue
        try:
            installed = md.version(dist)
        except md.PackageNotFoundError:
            installed = "?"
        want = pins.get(dist.lower())
        if want and installed != want and installed != "?":
            warn(f"{dist:<18} {installed} installed but {want} is pinned "
                 f"-- this environment does not match requirements.txt")
        else:
            ok(f"{dist:<18} {installed}")
    return healthy


def check_optional():
    print("\nOptional extras")
    for mod, (dist, cost) in OPTIONAL.items():
        try:
            importlib.import_module(mod)
        except Exception as e:
            detail = str(e).strip().splitlines()[0] if str(e) else type(e).__name__
            warn(f"{dist:<24} absent -> {cost}")
            if "libgomp" in detail:
                print("            -> missing OpenMP runtime. On Debian/Ubuntu: "
                      "apt-get install libgomp1")
        else:
            try:
                ok(f"{dist:<24} {md.version(dist)}")
            except md.PackageNotFoundError:
                ok(f"{dist:<24} present")


def check_wheels(pins):
    """Confirm each pin publishes a binary wheel on every supported platform."""
    print("\nWheel coverage (core pins must need no compiler on any platform)")
    plats = {
        "linux-x86_64": lambda f: "manylinux" in f and "x86_64" in f,
        "linux-aarch64": lambda f: "manylinux" in f and "aarch64" in f,
        "macos-arm64": lambda f: "macosx" in f and "arm64" in f,
        "macos-x86_64": lambda f: "macosx" in f and "x86_64" in f,
        "windows-amd64": lambda f: "win_amd64" in f,
    }
    bad_pins = []
    for dist, version in sorted(pins.items()):
        try:
            url = f"https://pypi.org/pypi/{dist}/{version}/json"
            with urllib.request.urlopen(url, timeout=30) as r:
                data = json.load(r)
        except Exception as e:
            bad(f"{dist}=={version}: could not query PyPI ({e})")
            bad_pins.append(dist)
            continue
        files = [u["filename"] for u in data.get("urls", [])]
        wheels = [f for f in files if f.endswith(".whl")]
        if any("-none-any.whl" in f for f in wheels):
            ok(f"{dist:<22} pure python (installs everywhere)")
            continue
        missing = [p for p, m in plats.items() if not any(m(f) for f in wheels)]
        if missing:
            bad(f"{dist:<22} NO WHEEL for: {', '.join(missing)} (needs a compiler there)")
            bad_pins.append(dist)
        else:
            ok(f"{dist:<22} wheels on all 5 platforms")
    return not bad_pins


def main():
    ap = argparse.ArgumentParser(description="Preflight check for a RainDrop environment.")
    ap.add_argument("--wheels", action="store_true",
                    help="also verify wheel coverage against PyPI (needs network)")
    args = ap.parse_args()

    print("=" * 68)
    print("RainDrop environment check")
    print("=" * 68)

    pins = parse_pins(ROOT / "requirements.txt")
    if not pins:
        print(f"\n  note: no pins found at {ROOT / 'requirements.txt'}")

    py_ok = check_python()
    core_ok = check_imports(pins)
    check_optional()

    wheels_ok = True
    if args.wheels:
        wheels_ok = check_wheels(pins)

    print("\n" + "=" * 68)
    if py_ok and core_ok and wheels_ok:
        print(f"{GREEN}Core environment is usable.{RESET}")
        print("Missing optional extras only disable the features listed above.")
        return 0
    print(f"{RED}Core environment is NOT usable.{RESET}")
    print("Fix the FAIL lines above, or run everything through Docker:")
    print("    docker compose up -d")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
