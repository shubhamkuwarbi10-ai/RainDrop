# AquaSight: AI-Coupled Urban Flood Nowcasting & Safe-Routing Engine

AquaSight couples atmospheric precipitation nowcasting (optical-flow radar/satellite tracking) with 30m ISRO Bhuvan CartoDEM surface hydrology and a machine-learning surrogate model to deliver street-level flood depth forecasts (0–3 hours), and water level increase predictions ($\text{cm}$). See **Model status** below for what is validated and what is not.

---

## Model status

Read this before citing any number from this project.

**The surrogate model is trained on synthetic targets.** `models/train_surrogate.py` generates flood depth from a parametric equation (`generate_synthetic_dataset`), then fits a `RandomForestRegressor` to it. No hydrodynamic solver runs anywhere in this repository: EPA-SWMM and PySWMM are not installed, called, or wrapped. A model fitted this way recovers the equation it was given and nothing else, so its error against real flood depth is unmeasured.

**Nowcast skill is now measured.** `pipeline/validate_nowcast.py` forecasts from time t and scores the result against what was actually observed at t+30/60/90 min, pooling contingency counts across all launches before computing CSI. `GET /api/metrics` serves that file and returns 503 when it is absent, instead of the `np.random` arrays it used to score against themselves.

Measured over 68 launches on 20-22 June 2025, Chennai 8 degree domain (80x80 cells at 0.1 degree), compared against a persistence baseline:

| Lead | Threshold | CSI nowcast | CSI persistence |
|---|---|---|---|
| 30 min | 10 mm/hr | **0.360** | 0.320 |
| 30 min | 2.5 mm/hr | **0.376** | 0.372 |
| 30 min | 0.1 mm/hr | 0.460 | 0.480 |
| 60 min | 10 mm/hr | **0.177** | 0.169 |
| 90 min | 0.1 mm/hr | 0.248 | 0.264 |

Optical flow beats persistence for heavy rain at short lead times and loses for light drizzle. That is the expected physics: organised convective cells translate, so advecting them helps, while light widespread rain evolves in place faster than it moves. Skill decays with lead time at every threshold.

Two caveats on these numbers. They come from three days in June, which is pre-monsoon for Chennai, so they are a demonstration that the measurement works rather than a seasonal result; rerun over the full June-September archive for a figure worth quoting. And cells with no advection information, where air flows in from outside the domain, are excluded from both forecasts so neither is scored on cells the other never had to predict.

**The surrogate model's metrics are still not validation results.** `train_surrogate.py` reports R-squared on its own training set with no held-out split, and its target is synthetic, so a high value is guaranteed by construction. That number does not belong in a report.

**No city currently has real terrain.** The CartoDEM tiles in `data/raw/cartodem/` cover inland Tamil Nadu and Karnataka (lon 74-80, lat 9-13). None of them overlap Chennai (lon 80.10-80.45), Mumbai, or Delhi. Until earlier today the tile-matching test padded each AOI by 0.25 degrees, which accepted an adjacent tile, stretched it across the city, and reported `is_real_dem: true`. That is where the 954 m maximum elevation in `chennai_dem_summary.json` came from, on a coastal plain. All three cities now fall back to a fitted synthetic surface and say so in `dem_source_label`. To get real terrain, download the tiles that actually cover each AOI.

**What is real.** The pySTEPS nowcasting in `pipeline/nowcast_pysteps.py` runs Lucas-Kanade optical flow and semi-Lagrangian extrapolation on ingested IMERG rasters, and the IMERG ingest is correctly georeferenced. Motion is estimated from the most recent frames only; using the whole archive averaged a real storm field down to 4 km/h.

**Run the nowcast in Docker.** pysteps ships no binary wheels and must be compiled, which is not possible on a Windows host where Application Control blocks Cython and MSVC is absent. `Dockerfile.nowcast` builds an image that compiles it, and fails the build if optical flow cannot recover a known injected motion vector:

```bash
docker build -f Dockerfile.nowcast -t raindrop-nowcast .
docker run --rm -v "%cd%:/app" raindrop-nowcast python pipeline/validate_nowcast.py \
    --input data/processed/nowcast/forecast.tif --output data/processed/nowcast_validation.json
```

Note that pysteps treats opencv as an optional dependency, but `dense_lucaskanade` fails at runtime without it, so it is pinned in `requirements.txt`.

**There is no routing.** `GET /api/spot_check` returns predicted depth at a named ward plus a crossing verdict. It does not compute a route: the project has no road graph and no OSRM instance.

To make the surrogate defensible, run a solver to produce targets, add a held-out split, and compare against a linear baseline. On the current synthetic data a linear regression beats the RandomForest (held-out RMSE 0.73 cm against 0.89 cm), which is what you expect when the target is itself linear.

---

## 🗺️ 30m CartoDEM Flood Water Level Increase Engine
> **Detailed Documentation**: See [DEM Flood Prediction Guide](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/docs/DEM_FLOOD_PREDICTION_README.md)

AquaSight ingests 30m ISRO Bhuvan CartoDEM v3 elevation tiles to compute surface hydrology (slope, D8 flow direction, flow accumulation, and depression sinks). A **RandomForest surrogate model** predicts **water level increase ($\text{cm}$)** from rainfall intensity, terrain slope, elevation, and urban surface impermeability. It is fitted to synthetic targets, not to simulated or observed flood depths.

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
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
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
