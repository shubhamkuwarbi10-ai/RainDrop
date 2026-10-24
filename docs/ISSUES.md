# RainDrop issue register

Every issue found by the environment and functionality audit of 24 October 2026,
with how it was found and whether it is fixed. Issues are not deleted when
fixed, so a reviewer can see what was wrong and what the fix was.

`docs/STATUS.md` remains the source of truth for *what the system claims*.
This file is the source of truth for *what is broken or fragile*.

Severity:

| | meaning |
|---|---|
| **blocker** | the application or pipeline does not run |
| **major** | works, but wrong results or a whole feature unavailable |
| **minor** | correct but fragile, confusing, or wasteful |

---

## Fixed

### E1 — pysteps made the whole dependency set uninstallable. blocker
`pysteps==1.21.5` publishes **no binary wheel for any platform** — PyPI carries
only an sdist — so `pip install -r requirements.txt` compiled it from source and
failed on every machine without a C toolchain. It sat in the core requirements,
so one source-only package made the entire install non-portable.

*Found by* querying the PyPI JSON API for every pin and classifying its
distributions (the check now lives in `tools/check_env.py --wheels`). All 17
other pins ship binary wheels for linux-x86_64, linux-aarch64, macos-arm64,
macos-x86_64 and windows-amd64; pysteps was the only exception.

*Fix* moved pysteps and opencv into `requirements-nowcast.txt`. Nothing in the
API imports either, and `pipeline/nowcast_pysteps.py` already guarded the import,
so the core degrades rather than failing. *Verified* `pip install -r
requirements.txt` succeeds on bare `python:3.11/3.12/3.13-slim-trixie` with no
compiler and no system packages.

### E2 — stated Python floor was wrong, and never enforced. major
`setup.ps1` said "Python 3.10+ is required". numpy, scipy and scikit-learn all
publish `cp311` as their lowest wheel, so 3.10 cannot work. Neither setup script
checked the version at all, so a 3.10 user got a resolver error listing every
numpy ever released rather than "your Python is too old".

*Verified* `pip install -r requirements.txt` on `python:3.10-slim` fails with
`No matching distribution found for numpy==2.4.6`.

*Fix* real version gates in `setup.sh` and `setup.ps1`, the supported range
(3.11–3.14) documented in `requirements.txt`, and `tools/check_env.py` reports
it with a clear message.

### E3 — rasterio installs but will not import on a minimal Linux image. major
The rasterio wheel bundles GDAL but still needs `libexpat.so.1` from the system.
On `python:3.12-slim-trixie` the install succeeds and `import rasterio` then dies
with `libexpat.so.1: cannot open shared object file`. "Has a wheel" is not the
same as "runs on a bare machine".

*Fix* documented in `docs/ENVIRONMENT.md` as the one required system package.
The application image was already unaffected: its `libgdal36` pulls libexpat in.

### E4 — five declared dependencies were never imported. minor
`pandas`, `geopandas`, `shapely`, `xgboost` and `requests` had **zero**
references anywhere in the 59 Python files. `xgboost` alone is a large compiled
package. They inflated the image and widened the portability surface for nothing.

*Found by* an AST scan of every file, cross-referenced against the pins.
*Fix* removed. `scipy` was kept: nothing imports it directly, but scikit-learn
requires it and pinning it stops its numerics drifting under the trained model.
`psycopg2-binary` and `opencv-python-headless` were also kept — neither is
imported directly, but the first backs the `postgresql+psycopg2://` driver and
the second is needed by pysteps at runtime.

### E5 — pydantic imported but not declared. minor
`backend/app/api/auth.py` and `backend/app/schemas/common.py` import pydantic
directly while relying on fastapi to pull it in. A fastapi upgrade could move
the pin underneath the code. *Fix* pinned explicitly at the locked version.

### E6 — runtime image could not import pysteps. blocker
The runtime stage installed `libpq5`, `libgdal36` and `curl` but not `libgomp1`,
the OpenMP runtime. The builder stage gets it via `build-essential`, so pysteps
compiled there and then died at import in the deployed image with
`libgomp.so.1: cannot open shared object file`. **The nowcast was unavailable in
every image ever built**, silently, because the import was guarded.

*Fix* `libgomp1` added to the runtime stage. *Verified* `docker/verify_pysteps.py`
now recovers an injected +2.00 px/step motion as +2.01 inside the image.

### E7 — startup crashed on the read-only artefact mounts. blocker
`ensure_dirs()` called `mkdir` on `data/processed/forecasts`, `terrain` and
`models/artifacts`, all mounted `:ro` by docker-compose. Startup died with
`OSError: [Errno 30] Read-only file system`. Those directories do not exist in
the repository, so **the stack could not start as shipped**.

*Fix* only `STATE_DIR` (operator credentials, a writable named volume) is now
required; the read-only artefact directories are reported, not created, and the
readers already fall back.

### E8 — IMERG rasters were misregistered by up to half a cell. major
`pipeline/ingest_imerg.py` built the GeoTIFF transform from `longitudes.min()`
and `.max()`, which are pixel **centres**. A 5-cell window therefore spanned
4 × 0.1° and reported 0.08°/px instead of 0.1°, displacing every cell by up to
~5.5 km — on an 11 km grid.

*Found by* `tests/test_georeferencing.py` run against the 83 real granules.
*Fix* the extent is expanded half a cell on each side. *Verified* the test now
passes, matching pixel size, orientation and every cell value against the source
HDF5.

### E9 — the deployed image carried 1.1 GB of an unrelated tool's worktree. major
`.dockerignore` excluded `.git`, `data/` and `dataset/`, but not `.kilo/`, a
worktree directory left by another agent tool. `COPY . /app` therefore baked all
1.1 GB of it into every image: shipped to every deployment, in every layer push
and pull, for nothing.

*Found by* `docker history` showing a 1.24 GB `COPY . /app` layer against an
application tree that `du` measured at ~71 MB.

*Fix* `.kilo`, `.impeccable` and `graphify-out` added to `.dockerignore`.
*Verified* the image went from **3.9 GB to 1.6 GB**, a 2.3 GB reduction, with
`docker/verify_pysteps.py` still passing in the rebuilt image.

---

## Open

### C1 — browser downloader defaults to a Windows-only path. minor
`pipeline/download_imerg_browser.py` hardcodes
`C:\Program Files\BraveSoftware\...\brave.exe` as the default for `--brave`, and
assumes `~/Downloads` is where the browser saves. It is overridable, but on
Linux or macOS the default fails with a confusing error rather than saying the
browser was not found.

*Suggested fix* probe per-OS locations and exit with a clear message naming
`--brave` when none is found. Low priority: this is a fallback tool for machines
where `~/.netrc` is not set up, and `pipeline/download_imerg.py` is the
supported path.

### C2 — `server/main.py` imports a module called `main`. minor
The compatibility shim does `from main import app` after putting `backend/` on
`sys.path`. Any other `main.py` earlier on the path wins, and the failure would
be a confusing wrong-app import rather than an error.

*Suggested fix* `from backend.main import app`, which is unambiguous.

### C3 — two environment variables are undocumented. minor
`OPEN_METEO_URL` and `RAINDROP_NEW_OPERATOR_PASSWORD` are read by the code but
absent from `.env.example`. The second matters: it is how a password reaches
`manage_operators.py` without going on the command line.

### C4 — a database failure surfaces as an opaque 500. minor
With the database unreachable or rejecting credentials, `/health/db` returns
`500 {"detail":"Internal server error."}` rather than a 503 naming the database.
In a system whose stated discipline is to say plainly when data is unavailable,
the health endpoint should be the clearest of all.

*Found by* pointing the stack at a Postgres volume whose password no longer
matched.

### C5 — `setup.sh` may generate an empty secret. minor
The secret generator falls back to `python3` when `openssl` is absent, but that
fallback runs *before* the script checks python3 exists. With neither present it
writes an empty value and docker-compose then refuses to start with a message
about the variable rather than about the missing tools.

### C6 — Windows Application Control can block compiled extensions. environmental
On a Windows host with Application Control enabled, a correctly installed wheel
can still fail to load: `DLL load failed ... An Application Control policy has
blocked this file`. Observed on this project's own development machine for
rasterio and SQLAlchemy. Nothing in the repository can fix it.

*Workaround* run through Docker. `tools/check_env.py` detects this specific
error and says so.

---

## Known model limitations

These are not defects. They are stated here and in `docs/STATUS.md` so nobody
mistakes an estimate for a measurement.

- **M1 — there is no trained surrogate.** `models/train_surrogate.py` refuses to
  run until EPA-SWMM labels exist, so the API serves the documented rational-method
  heuristic. The previously shipped artefact was fitted to a synthetic parametric
  equation; its R² of 0.99 measured how well it relearned its own label formula.
- **M2 — the depth estimate has no measured error.** We can say what it is
  derived from, not how close it is to reality.
- **M3 — the drainage network is schematic**, built from terrain and published
  design figures, because the municipal asset registers are not public.
- **M4 — no uncertainty range.** A single number implies a precision the method
  does not have.
- **M5 — IMERG Final is a hindcast.** It is published months late, so any demo
  built on it is a replay, not a live nowcast. Only IMERG Early (~4 h) or radar
  could drive a real one.
