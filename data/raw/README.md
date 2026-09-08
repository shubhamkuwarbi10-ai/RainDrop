# 📥 Raw Datasets Directory (`data/raw/`)

This directory contains raw, unprocessed satellite observation datasets ingested by the **AquaSight RainDrop Nowcasting & Flood Prediction Engine**.

---

## 📁 Directory Layout

```text
data/raw/
├── imerg/                 # NASA GPM IMERG Half-Hourly HDF5 Rainfall Files
├── cartodem/              # ISRO Bhuvan CartoDEM 30m 16-bit Elevation GeoTIFF Tiles
├── cartodem_zips/         # Raw Bhuvan CartoDEM .zip Tile Archives
├── state_rainfall_stats.csv # State-wide precipitation statistics baseline
└── README.md              # Dataset & Attribute Documentation
```

---

## 1. NASA GPM IMERG Half-Hourly Rainfall Dataset (`data/raw/imerg/`)

### 🛰️ Data Source & Format
- **Source**: NASA Global Precipitation Measurement (GPM) Integrated Multi-satellite Retrievals for GPM (IMERG) Version 07B.
- **File Format**: `3B-HHR.MS.MRG.3IMERG.YYYYMMDD-SXXXXXX-EXXXXXX.XXXX.V07B.HDF5` (HDF5 format).
- **Temporal Resolution**: 30-minute intervals (48 frames per day).
- **Spatial Resolution**: $0.1^\circ \times 0.1^\circ$ (approx. $10\text{ km} \times 10\text{ km}$).

### 📊 Raw File Attributes & Datasets inside HDF5
Inside each raw IMERG HDF5 file, the dataset group `/Grid/` contains the following attributes:

| Raw Attribute / Dataset | Data Type | Units | Description |
|---|---|---|---|
| `/Grid/precipitationCal` | `float32` | $\text{mm/hr}$ | **Primary calibrated precipitation rate** (combines microwave + IR sensors) |
| `/Grid/precipitationUncal` | `float32` | $\text{mm/hr}$ | Uncalibrated microwave precipitation estimate |
| `/Grid/randomError` | `float32` | $\text{mm/hr}$ | Estimated measurement error margin |
| `/Grid/probabilityLiquid` | `int8` | $\%$ | Probability of liquid precipitation (0–100%) |
| `/Grid/lat` | `float32` | Degrees | Latitude coordinates ($-90^\circ$ to $+90^\circ$) |
| `/Grid/lon` | `float32` | Degrees | Longitude coordinates ($-180^\circ$ to $+180^\circ$) |
| `/Grid/time` | `int32` | Seconds | Seconds since epoch (1970-01-01) |

### 🧠 Attributes Extracted & Used in Model Pipeline
- **Selected Attribute**: `/Grid/precipitationCal`
- **Processing Step**: `pipeline/ingest_imerg.py` crops global grids to city bounding boxes, replaces nodata (`-9999.9`) with `0.0`, and passes sequence arrays to pySTEPS optical flow to extract:
  1. **`total_rainfall_mm`**: Accumulated precipitation over forecast horizon ($24\text{h}$).
  2. **`peak_intensity_mm_hr`**: Maximum 30-min rainfall intensity rate ($\max(\text{precipCal})$).

---

## 2. ISRO Bhuvan CartoDEM 30m Elevation Dataset (`data/raw/cartodem/`)

### 🛰️ Data Source & Format
- **Source**: ISRO Cartosat-1 Digital Elevation Model (CartoDEM v3 R-1), Bhuvan Geoportal.
- **File Format**: 16-bit GeoTIFF (`.tif`) and shapefile metadata.
- **Spatial Resolution**: $30\text{ m}$ ($1\text{ arc-second} \approx 0.0002778^\circ$).
- **Coordinate System**: WGS84 (`EPSG:4326`).

### 📊 Raw File Attributes inside GeoTIFF
Inside each raw CartoDEM tile (e.g. `cdnd43v.tif`):

| Raw Attribute / Metadata | Data Type | Units | Description |
|---|---|---|---|
| `Band 1 (Elevation)` | `int16` | Meters ($m$) | **Raw physical land surface elevation above mean sea level** |
| `CRS` | String | - | Geographic Coordinate Reference System (`EPSG:4326`) |
| `Transform` | Affine Matrix | - | Spatial bounding coordinates and pixel resolution transform |
| `NoData Value` | `int16` | - | Filler value (`-9999` or `-1024`) over ocean/void areas |

### 🧠 Attributes Extracted & Used in Model Pipeline
- **Selected Attribute**: `Band 1 (Elevation)`
- **Processing Step**: `pipeline/process_dem.py` cleans nodata fill values, fills sinks, and derives:
  1. **`elevation_m`**: Mean and cell-level surface elevation ($z$).
  2. **`slope_deg`**: 2nd-order Sobel spatial slope angle ($\theta^\circ$).
  3. **`flow_accumulation`**: D8 upstream contributing cell count.
  4. **`depressions_count`**: Topological sink count.

---

## 3. Summary: Features Passed to the ML Surrogate Model

The ML Hydrodynamic Surrogate Regressor (`models/train_surrogate.py`) receives a 5-feature vector derived from these raw attributes:

$$X = \begin{bmatrix} \text{total\_rainfall\_mm} & \text{peak\_intensity\_mm\_hr} & \text{slope\_deg} & \text{elevation\_m} & \text{impermeability\_pct} \end{bmatrix}$$

| Feature Index | Attribute Name | Source Raw Attribute | Model Role & Influence |
|---|---|---|---|
| `X[0]` | `total_rainfall_mm` | `/Grid/precipitationCal` (IMERG) | Total precipitation input volume ($\text{mm}$) |
| `X[1]` | `peak_intensity_mm_hr` | `/Grid/precipitationCal` (IMERG) | Peak rain rate driving sudden surface runoff |
| `X[2]` | `slope_deg` | `Band 1 Elevation` (CartoDEM) | Surface slope ($\theta^\circ$): Steep slopes accelerate runoff velocity |
| `X[3]` | `elevation_m` | `Band 1 Elevation` (CartoDEM) | Surface elevation ($z\text{ m}$): Low basin elevations trap ponding water |
| `X[4]` | `impermeability_pct` | GIS Land Use Layer | Surface paving density ($50\%-95\%$): Prevents soil infiltration |

### 🎯 Target Attribute Output Generated by Model
- **`water_level_increase_cm`**: Predicted flood depth ($\text{cm}$) during rainfall.
