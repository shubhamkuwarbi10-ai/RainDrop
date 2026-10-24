# Getting a working RainDrop environment

Verified on 24 October 2026 by installing from scratch on clean images. Every
claim below was tested, not assumed.

Check any machine before trusting it:

```bash
python tools/check_env.py            # is this interpreter usable?
python tools/check_env.py --wheels   # do all pins still ship wheels everywhere?
```

It exits 0 when the core is usable and 1 when it is not, and names what each
missing piece costs you.

---

## The short version

| You want to | Do this |
|---|---|
| Run the whole system | `docker compose up -d` |
| Run the API and tests natively | `pip install -r requirements-dev.txt` |
| Run the rainfall nowcast natively | also `pip install -r requirements-nowcast.txt`, **needs a C compiler** |
| Run the nowcast without a compiler | `docker build -f Dockerfile.nowcast -t raindrop-nowcast .` |

Docker is the supported path. Everything below is for running without it.

---

## Supported Python

**3.11 to 3.14.** Not 3.10.

numpy, scipy and scikit-learn publish `cp311` as their lowest wheel. On 3.10 pip
does not say "your Python is too old" — it prints every numpy version ever
released and ends with `No matching distribution found for numpy==2.4.6`.
`setup.sh` and `setup.ps1` now stop with a clear message instead.

Tested: 3.11, 3.12 and 3.13 install the core cleanly on bare images. 3.14 has
wheels for every pin but has not been run end to end.

---

## Why there are three requirements files

| file | what it is | needs a compiler? |
|---|---|---|
| `requirements.txt` | API, pipeline, terrain, model loading | **no** |
| `requirements-nowcast.txt` | pysteps + opencv, for the rainfall nowcast | **yes** |
| `requirements-dev.txt` | core + pytest, httpx, pip-audit | no |

`requirements.txt` is deliberately compiler-free. Every pin in it ships a
prebuilt binary wheel for all five supported platforms:

```
                  linux-x86_64  linux-aarch64  macos-arm64  macos-x86_64  windows-amd64
numpy, scipy, h5py, rasterio, scikit-learn      wheels on all five
fastapi, pydantic, uvicorn, SQLAlchemy,
GeoAlchemy2, python-dotenv                      pure python
psycopg2-binary                                 wheels on all five
```

`pysteps` is the exception and the reason the split exists: it publishes **no
wheel on any platform**, only an sdist, so pip must compile it. Keeping it in
the core made one unbuildable package break the whole install. Nothing in the
API imports pysteps, and `pipeline/nowcast_pysteps.py` guards the import, so
without it everything works except the nowcast itself.

Re-check that property at any time with `python tools/check_env.py --wheels`.

---

## System packages

Python wheels are not always self-contained.

**Linux (minimal images such as `python:3.x-slim`)**

```bash
apt-get install -y libexpat1          # rasterio's bundled GDAL needs it at runtime
```

Without it the install succeeds and `import rasterio` then fails with
`libexpat.so.1: cannot open shared object file`. Full desktop distributions
normally already have it. The application image is unaffected: its `libgdal36`
pulls libexpat in.

For the nowcast extra, add:

```bash
apt-get install -y build-essential libgomp1   # compile pysteps; libgomp1 to import it
```

`libgomp1` is easy to miss. pysteps compiles against OpenMP via `build-essential`
and then needs `libgomp.so.1` at run time; a runtime image that omits it imports
nothing and the nowcast silently becomes unavailable.

**macOS** — `xcode-select --install` for the nowcast extra. The core needs nothing.

**Windows** — the core needs nothing. For the nowcast extra, Microsoft C++ Build
Tools ("Desktop development with C++"). Note that a machine with **Windows
Application Control** enabled may block a compiled extension from loading even
after it builds, with `DLL load failed ... An Application Control policy has
blocked this file`. Nothing in this repository can work around that; use Docker.
`tools/check_env.py` recognises the error and says so.

---

## Native install, step by step

```bash
# 1. a supported interpreter
python --version                      # must be 3.11 - 3.14

# 2. an isolated environment
python -m venv venv
. venv/bin/activate                   # Windows: venv\Scripts\activate

# 3. the compiler-free core, plus test tools
pip install --upgrade pip
pip install -r requirements-dev.txt

# 4. prove it
python tools/check_env.py             # exits 0 when usable
python -m pytest                      # 99 tests

# 5. only if you need the nowcast locally, and have a compiler
pip install -r requirements-nowcast.txt
python docker/verify_pysteps.py       # asserts optical flow really works
```

`setup.sh` and `setup.ps1` do all of this, prefer Docker when it is running, and
stop with a clear message when the Python is too old.

---

## Reproducibility

`requirements.txt` pins exact versions rather than ranges. An unpinned rebuild
could pull a different numpy or scikit-learn than the one a model artefact was
trained against, and a pickled scikit-learn model carries no version check.

`requirements.lock.txt` is the full transitive set, for rebuilding a byte-identical
environment. Regenerate it from a clean install after changing any pin:

```bash
docker run --rm -v "$PWD:/app" -w /app python:3.11-slim-trixie sh -c \
  "pip install -q -r requirements.txt -r requirements-nowcast.txt && pip freeze" \
  > requirements.lock.txt
```

---

## What "working" was verified to mean

| check | result |
|---|---|
| `pip install -r requirements.txt` on bare `python:3.11-slim-trixie` | passes, no compiler |
| the same on 3.12 and 3.13 | passes |
| the same on 3.10 | **fails**, as documented |
| all 12 core imports on a bare image plus `libexpat1` | pass |
| `python -m pytest` on that bare install, no pysteps | 99 passed |
| `from backend.main import app` on a core-only install | imports, `HAS_PYSTEPS=False` |
| `docker/verify_pysteps.py` in the application image | recovers +2.01 px/step against +2.00 injected |
| ingest → nowcast end to end over the real IMERG archive | forecast, baseline and sidecar written |
