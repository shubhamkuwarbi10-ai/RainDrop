# AquaSight: Urban Flood Nowcasting Engine

AquaSight couples atmospheric precipitation nowcasting (optical-flow radar/satellite tracking) with 30m ISRO Bhuvan CartoDEM surface hydrology and a machine-learning surrogate model to deliver street-level flood depth forecasts (0–3 hours), and water level increase predictions ($\text{cm}$). See **Model status** below for what is validated and what is not.

---

## Model status

Read this before citing any number from this project.

**The surrogate model is trained on synthetic targets.** `models/train_surrogate.py` generates flood depth from a parametric equation (`generate_synthetic_dataset`), then fits a `RandomForestRegressor` to it. No hydrodynamic solver runs anywhere in this repository: EPA-SWMM and PySWMM are not installed, called, or wrapped. A model fitted this way recovers the equation it was given and nothing else, so its error against real flood depth is unmeasured.

**Nowcast skill is now measured.** `pipeline/validate_nowcast.py` forecasts from time t and scores the result against what was actually observed at t+30/60/90 min, pooling contingency counts across all launches before computing CSI. `GET /api/metrics` serves that file and returns 503 when it is absent, instead of the `np.random` arrays it used to score against themselves.

Measured over **815 launches spanning 2025-06-20 to 2025-09-30** (the full monsoon archive, 4944 half-hourly IMERG frames, stride 6 = one launch every 3 h), Chennai 8 degree domain (80x80 cells at 0.1 degree). Frame contiguity was verified from the sidecar: 0 launches crossed a time gap and 0 failed. Three methods are scored side by side against a persistence baseline, all on the same launches and the same cells. Bold marks the best method where it also beats persistence.

| Lead | Threshold | Extrapolation | Extrapolation (dB) | S-PROG | Persistence |
|---|---|---|---|---|---|
| 30 min | 10.0 mm/hr | **0.423** | 0.407 | 0.341 | 0.393 |
| 60 min | 10.0 mm/hr | **0.254** | 0.240 | 0.206 | 0.237 |
| 90 min | 10.0 mm/hr | **0.161** | 0.152 | 0.131 | 0.150 |
| 30 min | 0.1 mm/hr | 0.627 | 0.635 | **0.637** | 0.632 |
| 60 min | 0.1 mm/hr | 0.501 | 0.503 | **0.520** | 0.506 |
| 90 min | 0.1 mm/hr | 0.422 | 0.422 | **0.443** | 0.426 |

This supersedes an earlier 68-launch result from 20-22 June 2025 alone. That window was pre-monsoon and unrepresentative: it put persistence at 0.321 for 30 min / 10 mm/hr where the full season puts it at 0.393, and it showed extrapolation *losing* to persistence at 90 min where the full season shows it winning. The three-day numbers demonstrated that the measurement worked; they did not measure the season.

**The split between methods is now clean, and it runs along the threshold.** At 10 mm/hr, plain extrapolation beats persistence at every lead time. At the 0.1 mm/hr rain footprint it is the other way round: extrapolation is at or below persistence, and S-PROG is the only method that beats it, at every lead. S-PROG splits the field into spatial scales and lets the unpredictable small ones fade instead of carrying them forward intact. That buys it the light-rain footprint and costs it the heavy-rain cores, because at 11 km resolution convective cores *are* the small scales it damps. The dB transform alone changes little either way.

**The served default stays plain extrapolation, and this result now supports that rather than deferring it.** The previous caveat was that the heavy-rain sample was too small to separate the methods: 549 observed cells at 10 mm/hr. The full archive gives **11,465 observed cells at 10 mm/hr for the 30 min lead** (6,591 hits, 4,874 misses), a 21-fold larger sample, and extrapolation's margin over persistence holds across all three lead times. Heavy rain is what drives flooding, so that is the threshold the default is chosen on. `--method` selects any of the three.

**A blend of the two was tried and lost.** Since extrapolation wins at 10 mm/hr and S-PROG wins at 0.1 mm/hr, `--method blend` takes extrapolation wherever extrapolation itself forecasts at least 10 mm/hr and S-PROG elsewhere, switching on the forecast because the observation is not knowable at forecast time. On the same 815 launches it matches S-PROG exactly at 0.1 mm/hr, but at 10 mm/hr it scores 0.391 / 0.241 / 0.155 against extrapolation's 0.423 / 0.254 / 0.161, and at 30 min it drops below persistence. The switch cannot fire where extrapolation under-forecasts, which is precisely where the misses are, so the blend inherits S-PROG's weaker detection and gains nothing for it. It stays selectable so the negative result is reproducible.

The useful conclusion is that there is no single best field, and the choice belongs to the question rather than to the pixel. A flood decision asks about 10 mm/hr and should read extrapolation. A rain footprint asks about 0.1 mm/hr and should read S-PROG.

Remaining caveats. Margins over persistence are real but small (+0.030 CSI at 30 min, +0.011 at 90 min); the gain is in detection, not in a transformed forecast. Observed cells are strongly correlated in space and time, so the effective sample is smaller than the cell count suggests. And cells that any method could not inform, where rain flows in from outside the domain, are excluded from every method and the baseline alike (mean 286 of 6400 cells per launch).

Reproduce with:

```bash
docker run --rm -v "%cd%:/app" raindrop-nowcast python pipeline/validate_nowcast.py \
    --input data/processed/nowcast_full/forecast.tif \
    --output data/processed/nowcast_validation_full.json --stride 6
```

**The surrogate now sees terrain, which it previously did not.** Until today `get_city_terrain(lat, lon)` ignored the coordinates beyond choosing a city and returned the city-wide MEAN slope and elevation, so every point in Chennai was handed slope 1.32 deg and elevation 8.88 m. Terrain could not vary the prediction anywhere inside a city; only rainfall could. Meanwhile `process_dem.py` was computing flow accumulation and depression depth per pixel, writing them to GeoTIFF, and nothing ever read them.

The first half is fixed: `process_dem.py` writes per-pixel slope, flow accumulation and
depression depth, and `pipeline/terrain_ops.py` holds the algorithms that produce them.

> **Superseded by the branch merge.** The per-pixel feature sampler this section
> described (`pipeline/terrain_features.py`) belonged to a trainer that fitted a
> *synthetic parametric equation*, so its held-out R2 measured how well the model
> relearned its own label formula, not how deep water gets. `models/train_surrogate.py`
> now trains only on EPA-SWMM labels from `models/swmm_labels.py`, scores three
> baselines on the same split, holds out a whole city, and writes a model card the
> backend checks by SHA-256 before loading. It refuses to run until SWMM labels exist,
> so **there is no trained surrogate today** and the API serves the documented
> heuristic instead. The table below came from the superseded trainer; it is kept as
> a record of why city-mean terrain was useless, not as a current result.

The effect, same rainfall (150 mm / 24 h) at six Chennai ward centroids, which previously all returned an identical number:

| Ward | slope deg | log flow accum | depth cm |
|---|---|---|---|
| Pallikaranai | 0.69 | 6.08 | 110.6 |
| Velachery | 2.63 | 3.09 | 92.1 |
| Adyar | 6.43 | 2.64 | 88.1 |
| Tambaram | 1.77 | 0.69 | 82.4 |
| Ambattur | 6.53 | 1.10 | 80.4 |
| Chennai Central | 10.82 | 0.69 | 76.8 |

The ordering is plausible: Pallikaranai is reclaimed marshland with the largest upslope catchment and the flattest ground, and it floods. In the forest's feature importances the two new terrain fields (0.028 and 0.020) outrank slope (0.002) and elevation (0.0006) by an order of magnitude, which is the measurable sign that the old feature set was starving the model.

**None of that makes the depths real.** The target is still the parametric equation. What changed is that the model now responds to where you are, not that it knows how deep the water gets. Two things to keep in view when reading the table above: the absolute magnitudes are not credible (around a metre of standing water for 150 mm of rain is far too high; the equation's scale was never calibrated), and only the *ordering* between wards carries information. Do not publish these as depths.

One thing did get better on its own terms. Because terrain is applied as a multiplier on runoff rather than a separate additive term, the synthetic target is now non-linear, and the RandomForest finally beats the linear baseline on held-out data (RMSE 7.15 cm against 8.28 cm, R-squared 0.9906 against 0.9874). Previously linear won (1.09 against 2.22), which is what a linear target deserves. RMSE is not comparable across the two target definitions, only the gap between the two models is. The split is still random over rows; with real solver output it would have to be by scenario and spatial block, because neighbouring pixels are near-duplicates.

**All three cities now have real terrain.** The covering CartoDEM tiles have been downloaded, and `chennai`, `mumbai` and `delhi` all report `is_real_dem: true` with plausible coastal-plain values: Chennai max 151.6 m / mean 8.9 m, Mumbai max 303.0 m / mean 8.0 m, Delhi max 326.0 m / mean 220.3 m. This replaces an earlier state where the tile-matching test padded each AOI by 0.25 degrees, accepted an adjacent tile, stretched it across the city, and reported a 954 m maximum elevation on a coastal plain. The padding bug is fixed and the tiles now genuinely overlap each AOI.

**What is real.** The pySTEPS nowcasting in `pipeline/nowcast_pysteps.py` runs Lucas-Kanade optical flow and semi-Lagrangian extrapolation on ingested IMERG rasters, and the IMERG ingest is correctly georeferenced. Motion is estimated from the most recent frames only; using the whole archive averaged a real storm field down to 4 km/h.

**Run the nowcast in Docker.** pysteps ships no binary wheels and must be compiled, which is not possible on a Windows host where Application Control blocks Cython and MSVC is absent. `Dockerfile.nowcast` builds an image that compiles it, and fails the build if optical flow cannot recover a known injected motion vector:

```bash
docker build -f Dockerfile.nowcast -t raindrop-nowcast .
docker run --rm -v "%cd%:/app" raindrop-nowcast python pipeline/validate_nowcast.py \
    --input data/processed/nowcast/forecast.tif --output data/processed/nowcast_validation.json
# one nowcast with a chosen method: extrapolation (default), extrapolation_db, sprog
docker run --rm -v "%cd%:/app" raindrop-nowcast python pipeline/nowcast_pysteps.py \
    --frames-dir data/processed/nowcast --output data/processed/nowcast --method sprog
```

Note that pysteps treats opencv as an optional dependency, but `dense_lucaskanade` fails at runtime without it, so it is pinned in `requirements.txt`.

**There is no routing.** `GET /api/spot_check` returns predicted depth at a named ward plus a crossing verdict. It does not compute a route: the project has no road graph and no OSRM instance.

To make the surrogate defensible, run a solver to produce targets, add a held-out split, and compare against a linear baseline. On the current synthetic data a linear regression beats the RandomForest (held-out RMSE 0.73 cm against 0.89 cm), which is what you expect when the target is itself linear.

---

## 🗺️ 30m CartoDEM Flood Water Level Increase Engine
> **Detailed Documentation**: See [DEM Flood Prediction Guide](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/docs/DEM_FLOOD_PREDICTION_README.md)

AquaSight ingests 30m ISRO Bhuvan CartoDEM v3 elevation tiles to compute surface hydrology (slope, D8 flow direction, flow accumulation, and depression sinks). A **RandomForest surrogate model** predicts **water level increase ($\text{cm}$)** from rainfall intensity and the terrain at that pixel: slope, elevation, upslope contributing area, depression depth, and urban surface impermeability. It is fitted to synthetic targets, not to simulated or observed flood depths.

---

## Architecture Overview

```
[ NASA GPM IMERG / IMD Radar ]        [ 30m ISRO Bhuvan CartoDEM Tiles ]
               │                                      │
               ▼                                      ▼
   [ Step 1: Ingestion & Nowcasting ]     [ Step 2: D8 Surface Hydrology ]
   (pySTEPS Optical-Flow 0-3h Rain)       (Slope, Flow Accumulation, Sinks)
               │                                      │
               └──────────────────┬───────────────────┘
                                  ▼
             [ Step 3: RandomForest Surrogate Model ]
             (Synthetic training target - see Model status)
                                  │
                                  ▼
                [ Step 4: FastAPI Backend & Map UI ]
                (Multi-City GIS Grid: Chennai, Mumbai, Delhi)
```

---

## Directory Structure

```text
aquasight/
├── data/
│   ├── raw_radar/             # NASA IMERG HDF5 or IMD NetCDF files
│   ├── dem/                   # SRTM 30m / CartoDEM GeoTIFFs
│   └── processed/             # Cropped arrays and generated GeoTIFFs
├── models/
│   └── train_surrogate.py     # Fits RandomForest on synthetic targets
│                              # (writes artifacts/flood_surrogate.pkl, gitignored)
├── pipeline/
│   ├── ingest_imerg.py        # Step 1: HDF5 parsing and cropping
│   ├── nowcast_pysteps.py     # Step 2: Optical-flow extrapolation
├── server/
│   ├── main.py                # FastAPI endpoints
│   ├── database.py            # PostGIS connection & spatial queries
│   └── router.py              # OSRM dynamic penalty routing integration
├── requirements.txt
└── README.md
```

---

## Installation & Setup

### 1. Environment Setup

Python 3.10 or 3.11 is recommended.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Dependencies (`requirements.txt`)

See `requirements.txt`.

### 3. Database Initialization (PostGIS)

```sql
CREATE DATABASE aquasight_db;
\c aquasight_db;
CREATE EXTENSION postgis;

CREATE TABLE flooded_segments (
    id SERIAL PRIMARY KEY,
    road_id VARCHAR(64),
    forecast_time TIMESTAMP,
    depth_cm FLOAT,
    status VARCHAR(20),
    geom GEOMETRY(LineString, 4326)
);

CREATE INDEX idx_flooded_segments_geom ON flooded_segments USING GIST(geom);
```

---

## Step-by-Step Execution Pipeline

### Step 1: Ingestion and Bounding Box Slicing

Run `ingest_imerg.py` to extract and crop rainfall data for Mumbai:

```bash
python pipeline/ingest_imerg.py \
  --input-dir ./data/raw_radar \
  --output-dir ./data/processed \
  --lat-min 18.80 --lat-max 19.30 \
  --lon-min 72.70 --lon-max 73.05
```

### Step 2: Generate Radar Nowcast (pySTEPS)

Feed the last 3 time steps (90 minutes) to generate 15-minute forecasts for the next 3 hours:

```bash
python pipeline/nowcast_pysteps.py \
  --frames-dir ./data/processed \
  --leadtimes 12 \
  --output ./data/processed/forecasts/
```

### Step 3: Train / Update the ML Surrogate Model

Fit the RandomForest on synthetic targets. The script takes no arguments and writes `models/artifacts/flood_surrogate.pkl`:

```bash
python models/train_surrogate.py
```

### Step 4: Run the API & Routing Engine

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Model Tuning Guide

> Sections 2 and 3 below describe a target design. Neither EPA-SWMM nor XGBoost is implemented in this repository. Keep them as a roadmap, not a description of current behaviour.

### 1. Optical-Flow Nowcasting (`pySTEPS`)

* **Motion Algorithm (`extrap_method`):**
* `lucaskanade`: Fast and stable for local domains (recommended for hackathon demo).
* `vet`: Variational Echo Tracking. More accurate for rotational storm cells, but requires more compute.


* **Decomposition Levels (`fft_decomposition`):**
* Tune between `3` and `6` cascades depending on grid noise.


* **Timestep Extrapolation:** Keep forecast intervals at `15 min` with a cap at `180 min` ($t=12$), as optical flow degrades significantly beyond 2 hours.

### 2. Physical Engine (`EPA-SWMM`)

* **Routing Method:**
* Use `KINEMATIC_WAVE` for real-time calculation and synthetic dataset generation. Use `DYNAMIC_WAVE` only if modeling tidally influenced coastal backwater outfalls (e.g., Mithi River in Mumbai).


* **Blockage Factor (Silt & Waste Parameter):**
* Reduce default conduit cross-sectional area by $30\text{--}50\%$ (`geom1` conduit attribute) to represent real-world drainage degradation in Indian urban contexts.


* **Infiltration Parameters (Horton / Green-Ampt):**
* Dry soil (pre-monsoon): Max rate $75\text{ mm/hr}$, Min rate $8\text{ mm/hr}$, Decay constant $3\text{ hr}^{-1}$.
* Saturated soil (active monsoon): Drop max infiltration rate to $10\text{ mm/hr}$.



### 3. ML Surrogate Model (`XGBoost`)

When training the surrogate model on SWMM-generated outputs:

| Hyperparameter | Search Range | Recommended Default | Purpose |
| --- | --- | --- | --- |
| `max_depth` | `4 – 8` | `6` | Prevents overfitting to synthetic storm runs. |
| `learning_rate` | `0.01 – 0.1` | `0.05` | Balances convergence speed and generalization. |
| `n_estimators` | `100 – 500` | `300` | Tree count; early stop if test loss plateaus for 15 rounds. |
| `subsample` | `0.7 – 0.9` | `0.8` | Regularization via instance subsampling. |
| `colsample_bytree` | `0.6 – 0.9` | `0.8` | Selects fraction of terrain/drainage features per split. |
| `tree_method` | `auto / hist` | `hist` | Uses histogram-based splitting for fast CPU/GPU training. |

---

## Performance Evaluation Checklist

> Planned acceptance criteria. None of these are measured yet, and the SWMM and OSRM items cannot be measured until those components exist.

* [ ] **Data Slicing Latency:** Slicing raw HDF5 down to Mumbai takes $< 50\text{ ms}$.
* [ ] **Surrogate Model Latency:** Single-ward batch inference (3,000–5,000 street segments) completes in $< 300\text{ ms}$.
* [ ] **RMSE Tolerance:** Surrogate depth error is under $\pm 4.5\text{ cm}$ when compared to direct SWMM calculations.
* [ ] **Dynamic Rerouting Verification:** Marking a primary road with $> 30\text{ cm}$ water depth forces OSRM to generate an alternate route within $50\text{ ms}$.
