# AquaSight: AI-Coupled Urban Flood Nowcasting & Safe-Routing Engine

AquaSight couples atmospheric precipitation nowcasting (optical-flow radar/satellite tracking) with 30m ISRO Bhuvan CartoDEM surface hydrology and a machine-learning surrogate model to deliver street-level flood depth forecasts (0–3 hours), water level increase predictions ($\text{cm}$), and flood-resilient routing.

---

## 🗺️ 30m CartoDEM Flood Water Level Increase Engine
> **Detailed Documentation**: See [DEM Flood Prediction Guide](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/docs/DEM_FLOOD_PREDICTION_README.md)

AquaSight ingests 30m ISRO Bhuvan CartoDEM v3 elevation tiles to compute surface hydrology (slope, D8 flow direction, flow accumulation, and depression sinks). The **XGBoost / Random Forest Hydrodynamic Surrogate Model** predicts real-time **water level increase ($\text{cm}$)** based on rainfall intensity, terrain slope, elevation, and urban surface impermeability.

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
                [ Step 3: XGBoost Surrogate Model ]
                (Predicts Water Level Increase cm < 2ms)
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
│   ├── networks/              # EPA-SWMM input files (.inp) from SWMManywhere / OSM
│   └── processed/             # Cropped arrays and generated GeoTIFFs
├── models/
│   ├── train_surrogate.py     # Training script for XGBoost/Random Forest
│   ├── surrogate_config.json  # Model hyperparameters
│   └── artifacts/             # Serialized models (.json, .onnx, .joblib)
├── pipeline/
│   ├── ingest_imerg.py        # Step 1: HDF5 parsing and cropping
│   ├── nowcast_pysteps.py     # Step 2: Optical-flow extrapolation
│   └── swmm_runner.py         # Step 3: PySWMM physical validation
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

Train XGBoost on the simulated EPA-SWMM results:

```bash
python models/train_surrogate.py \
  --dataset ./data/processed/simulation_dataset.parquet \
  --save-path ./models/artifacts/flood_surrogate.json
```

### Step 4: Run the API & Routing Engine

```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Model Tuning & Hyperparameter Optimization Guide

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

Before deployment or judging, confirm the following benchmarks:

* [ ] **Data Slicing Latency:** Slicing raw HDF5 down to Mumbai takes $< 50\text{ ms}$.
* [ ] **Surrogate Model Latency:** Single-ward batch inference (3,000–5,000 street segments) completes in $< 300\text{ ms}$.
* [ ] **RMSE Tolerance:** Surrogate depth error is under $\pm 4.5\text{ cm}$ when compared to direct SWMM calculations.
* [ ] **Dynamic Rerouting Verification:** Marking a primary road with $> 30\text{ cm}$ water depth forces OSRM to generate an alternate route within $50\text{ ms}$.
