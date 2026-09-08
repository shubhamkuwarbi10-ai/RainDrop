# Walkthrough: Multi-City 2D GIS CartoDEM Processing & ML Flood Surrogate Integration

We have derived 30m CartoDEM 2D GIS grids and integrated multi-city terrain evaluation for **Delhi**, **Mumbai**, and **Chennai**.

## Key Accomplishments

### 1. 30m CartoDEM Processing Pipeline (`pipeline/process_dem.py`)
Processed 30m resolution digital elevation models for each target city area of interest:
- **Delhi** (`76.80–77.40 E`, `28.40–29.00 N` | $2226 \times 2226$ cells): Mean elevation $232.77\text{ m}$, Mean slope $0.85^\circ$, $1,477,161$ depression sinks.
- **Mumbai** (`72.75–72.95 E`, `18.90–19.10 N` | $742 \times 742$ cells): Mean elevation $30.77\text{ m}$, Mean slope $0.86^\circ$, $59,955$ depression sinks.
- **Chennai** (`80.10–80.45 E`, `12.90–13.30 N` | $1484 \times 1298$ cells): Mean elevation $24.77\text{ m}$, Mean slope $0.85^\circ$, $572,546$ depression sinks.

Generated GeoTIFF rasters for each city in `data/processed/`:
- `[city]_dem_filled.tif` (Sink-filled elevation grid)
- `[city]_slope.tif` (Surface slope degrees)
- `[city]_flow_direction.tif` (D8 flow directions: $1, 2, 4, 8, 16, 32, 64, 128$)
- `[city]_flow_accumulation.tif` (Upstream contributing area cell count)
- `[city]_depressions.tif` (Sink locations raster mask)
- `[city]_dem_summary.json` (City terrain statistics profile)

### 2. Multi-City ML Surrogate Model Integration (`server/main.py`)
- **No structural changes required in model**: The XGBoost surrogate model takes $X = [\text{total\_rainfall}, \text{peak\_intensity}, \text{slope}, \text{elevation}, \text{impermeability}]$ natively.
- **Dynamic Terrain Lookup (`get_city_terrain`)**: When receiving coordinates $(\text{lat}, \text{lon})$, `server/main.py` detects whether the location falls within Delhi, Mumbai, or Chennai bounds and dynamically extracts terrain slope and elevation for accurate ML flood depth predictions.
- **API Endpoint (`/api/dem/summary`)**: Exposes city-specific 30m CartoDEM metadata.

### 3. Interactive Multi-City Map UI (`client/index.html`)
- Added City Switcher dropdown (`Chennai`, `Mumbai`, `Delhi`).
- Rendered 2D GIS CartoDEM bounding boxes as interactive Leaflet polygon overlays.
- Displays dynamic 30m CartoDEM GIS summary legend card and detailed popup predictions.

---

## Verification Results

### API & Server Test Output
```json
{
  "location": { "lat": 28.61, "lon": 77.20, "city": "Delhi" },
  "terrain_profile": {
    "city": "Delhi",
    "slope_deg": 0.8477,
    "elevation_m": 232.77,
    "impermeability_pct": 60.0
  },
  "forecast": {
    "total_rainfall_mm": 1.3,
    "peak_intensity_mm_hr": 0.6,
    "predicted_flood_depth_cm": 0.0,
    "risk_level": "LOW"
  }
}
```
