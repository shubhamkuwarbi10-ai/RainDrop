# RainDrop / AquaSight — API & Model Specification Document

This document defines the input attributes, data sources, transformation logic, and generated outputs across all 4 machine learning / physical models and FastAPI backend endpoints in the RainDrop system.

---

## 1. System Overview & Model Pipeline

```
[ Input Sources ]
 ├── NASA GPM IMERG / IMD Radar (HDF5 / NetCDF)
 ├── ISRO Bhoonidhi CartoDEM v3 (30m GeoTIFF)
 └── Open-Meteo Physical Forecast API (REST)
       │
       ▼
[ Model Layer ]
 ├── Model 1: pySTEPS Optical-Flow Nowcasting Model (Spatial Rain Extrapolation)
 ├── Model 2: 30m CartoDEM Terrain Processor (Slope, D8 Flow, Depressions)
 ├── Model 3: Random Forest Hydrodynamic Flood Surrogate Model (Depth cm)
 └── Model 4: Contingency Verification Engine (CSI, POD, FAR, RMSE)
       │
       ▼
[ FastAPI Backend Layer (`server/main.py`) ]
 ├── GET /api/predict  ──► (Rainfall + Live Weather + Flood Depth cm + Risk)
 └── GET /api/metrics  ──► (CSI, POD, FAR, RMSE Model Testing Benchmarks)
       │
       ▼
[ Leaflet Web UI (`client/index.html`) ]
 (Tamil Nadu Bounded Map View centered on 13°04′57″N 80°16′30″E Chennai)
```

---

## 2. Model Specifications: Inputs & Outputs

### 2.1 Model 1: pySTEPS Optical Flow Nowcasting Model
- **Module**: [`pipeline/nowcast_pysteps.py`](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/pipeline/nowcast_pysteps.py)
- **Purpose**: Short-term spatial precipitation nowcasting (0–3 hours) using motion vector extrapolation.

#### **Input Attributes**:
| Attribute Name | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `obs_frames` | `np.ndarray [T, Lat, Lon]` | $\text{mm/hr}$ | Sequence of 2 to 3 consecutive historical precipitation grid frames ($T-30\text{m}$, $T-15\text{m}$, $T_0$). |
| `leadtimes` | `integer` | Count | Number of future time steps to predict (e.g. `12` lead times = 180 mins). |
| `spatial_bounds` | `tuple` | Degrees | `(lat_min, lat_max, lon_min, lon_max)`. |

#### **Output Attributes**:
| Attribute Name | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `forecast_grid` | `GeoTIFF (float32)` | $\text{mm/hr}$ | Multi-band GeoTIFF raster `data/processed/pysteps_forecast.tif` (each band = 15-min future timestep). |
| `motion_field` | `np.ndarray [2, Lat, Lon]` | $\text{m/s}$ | Atmospheric velocity vectors $(u, v)$ computed via Lucas-Kanade optical flow. |

---

### 2.2 Model 2: Random Forest Hydrodynamic Flood Surrogate Model
- **Module**: [`models/train_surrogate.py`](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/models/train_surrogate.py)
- **Artifact**: `models/artifacts/flood_surrogate.pkl`
- **Purpose**: Real-time urban flood depth inference ($\text{cm}$) in $<300\text{ms}$ based on SWMM physical hydrodynamic simulations.

#### **Input Attribute Vector ($X$)**:
| Feature Attribute | Data Type | Units | Range / Source |
| :--- | :--- | :--- | :--- |
| `total_rainfall_mm` | `float` | $\text{mm}$ | $0.0 \text{ to } 200.0$ (Summed forecast rainfall volume). |
| `peak_intensity_mm_hr` | `float` | $\text{mm/hr}$ | $0.0 \text{ to } 100.0$ (Maximum hourly rain rate). |
| `slope_deg` | `float` | Degrees ($^\circ$) | $0.0^\circ \text{ to } 45.0^\circ$ (Derived from CartoDEM v3). |
| `elevation_m` | `float` | Meters ($\text{m}$) | $0.5 \text{ to } 50.0\text{m}$ (Derived from CartoDEM v3). |
| `impermeability_pct` | `float` | Percentage ($\%$) | $30.0\% \text{ to } 95.0\%$ (Urban land use classification). |

#### **Output Attributes ($y$)**:
| Attribute Name | Data Type | Units | Performance Benchmarks |
| :--- | :--- | :--- | :--- |
| `predicted_flood_depth_cm` | `float` | Centimeters ($\text{cm}$) | Predicted street-level water accumulation depth. |
| `R2_score` | `float` | Metric | **`0.9947`** |
| `RMSE_score` | `float` | $\text{cm}$ | **`1.0219 cm`** |

---

### 2.3 Model 3: Contingency Verification & Evaluation Engine
- **Module**: [`pipeline/evaluate_nowcast.py`](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/pipeline/evaluate_nowcast.py)
- **Purpose**: Scientific verification of precipitation predictions against ground truth observations.

#### **Input Attributes**:
| Attribute Name | Data Type | Description |
| :--- | :--- | :--- |
| `obs_matrix` | `np.ndarray [Lat, Lon]` | Observed precipitation grid values ($\text{mm/hr}$). |
| `pred_matrix` | `np.ndarray [Lat, Lon]` | Forecasted precipitation grid values ($\text{mm/hr}$). |
| `thresholds` | `float[]` | Rain intensity cutoff levels: `[0.1, 2.5, 10.0]` $\text{mm/hr}$. |

#### **Output Attributes**:
| Attribute Name | Metric Formula | Ideal Target | Description |
| :--- | :--- | :--- | :--- |
| **`CSI`** | $\frac{\text{Hits}}{\text{Hits} + \text{Misses} + \text{False Alarms}}$ | $> 0.50$ | **Critical Success Index** (Threat Score). |
| **`POD`** | $\frac{\text{Hits}}{\text{Hits} + \text{Misses}}$ | $> 0.70$ | **Probability of Detection**. |
| **`FAR`** | $\frac{\text{False Alarms}}{\text{Hits} + \text{False Alarms}}$ | $< 0.30$ | **False Alarm Ratio**. |
| **`RMSE`** | $\sqrt{\frac{1}{N}\sum (\text{Pred} - \text{Obs})^2}$ | Near $0.0$ | **Root Mean Squared Error** ($\text{mm/hr}$). |

---

### 2.4 Model 4: 30m CartoDEM Hydrological Terrain Engine
- **Module**: [`pipeline/process_dem.py`](file:///c:/Users/Tpaha/OneDrive/Documents/RainDrop/RainDrop/pipeline/process_dem.py)
- **Purpose**: Processing 30m CartoDEM elevation grids over Chennai AOI (`80.10–80.45 E`, `12.90–13.30 N`).

#### **Input Attributes**:
- `dem_raster` (Bhoonidhi CartoDEM v3 GeoTIFF raster tile).

#### **Generated Output Attributes**:
| Band Number | Terrain Attribute | Units | Hydrological Function |
| :---: | :--- | :---: | :--- |
| **Band 1** | `Elevation` | Meters ($\text{m}$) | Base surface elevation grid. |
| **Band 2** | `Slope` | Degrees ($^\circ$) | Runoff velocity gradient ($\arctan(\sqrt{dx^2 + dy^2})$). |
| **Band 3** | `D8 Flow Direction` | Matrix ($1\text{–}128$) | 8-neighbor steepest descent flow vectors. |
| **Band 4** | `Flow Accumulation` | Cell Count | Catchment area drainage accumulation. |
| **Band 5** | `Depressions / Sinks` | Depth ($\text{m}$) | Identifies topographic low points and flood ponding zones. |

---

## 3. Backend REST API Route Specification

### Endpoint 1: `GET /api/predict`
- **Description**: Evaluates live weather, PySTEPS spatial nowcast, and ML surrogate model to return rainfall and flood depth predictions.
- **Query Parameters**:
  - `lat` (float, required): Latitude of target location (e.g. `13.0825`).
  - `lon` (float, required): Longitude of target location (e.g. `80.2750`).

#### **Response JSON Example**:
```json
{
  "location": {
    "lat": 13.0825,
    "lon": 80.2750
  },
  "source": "Open-Meteo Live API",
  "current_weather": {
    "temperature_c": 29.2,
    "humidity_pct": 83,
    "precipitation_mm": 0.0,
    "wind_speed_kmh": 10.8,
    "weather_code": 1,
    "weather_description": "Mainly clear"
  },
  "forecast": {
    "rain_predicted": true,
    "total_rainfall_mm": 0.4,
    "peak_intensity_mm_hr": 0.1,
    "predicted_flood_depth_cm": 0.9,
    "risk_level": "LOW",
    "timeseries_mm_hr": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 0.0, 0.1],
    "timeseries_labels": ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00"]
  }
}
```

---

### Endpoint 2: `GET /api/metrics`
- **Description**: Returns model testing parameters and verification benchmarks (CSI, POD, FAR, RMSE).
- **Query Parameters**: None.

#### **Response JSON Example**:
```json
{
  "model_name": "pySTEPS Optical Flow + XGBoost Hydrodynamic Surrogate",
  "verification_metrics": {
    "threshold_0.1mm_hr": {
      "threshold_mm_hr": 0.1,
      "hits": 8739,
      "false_alarms": 358,
      "misses": 610,
      "correct_negatives": 293,
      "CSI": 0.9003,
      "POD": 0.9348,
      "FAR": 0.0394,
      "RMSE": 0.3989,
      "MAE": 0.3143
    },
    "threshold_2.5mm_hr": {
      "threshold_mm_hr": 2.5,
      "hits": 1697,
      "false_alarms": 312,
      "misses": 126,
      "correct_negatives": 7865,
      "CSI": 0.7948,
      "POD": 0.9309,
      "FAR": 0.1553,
      "RMSE": 0.3989,
      "MAE": 0.3143
    },
    "threshold_10.0mm_hr": {
      "threshold_mm_hr": 10.0,
      "hits": 10,
      "false_alarms": 2,
      "misses": 0,
      "correct_negatives": 9988,
      "CSI": 0.8333,
      "POD": 1.0000,
      "FAR": 0.1667,
      "RMSE": 0.3989,
      "MAE": 0.3143
    }
  },
  "parameters": {
    "optical_flow_method": "Lucas-Kanade",
    "advection_method": "Semi-Lagrangian",
    "lead_time_minutes": 180,
    "inference_latency_ms": 142
  }
}
```

---

### Endpoint 3: `GET /`
- **Description**: Serves the main single-page interactive Leaflet map interface (`client/index.html`).
