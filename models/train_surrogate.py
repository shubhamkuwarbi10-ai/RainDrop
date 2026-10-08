import json
import pickle
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import logging

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

PRECIP_MAX_MM = 400.0  # trees cannot extrapolate: predictions plateau above this


def extract_dem_samples_from_rasters(num_samples: int = 5000):
    """
    Extract real 30m Bhuvan CartoDEM elevation and slope pixel distributions from processed GeoTIFF rasters.
    """
    processed_dir = Path(__file__).parent.parent / "data" / "processed"
    slopes = []
    elevations = []
    
    cities = ["chennai", "mumbai", "delhi"]
    for city in cities:
        dem_file = processed_dir / f"{city}_dem_filled.tif"
        slope_file = processed_dir / f"{city}_slope.tif"
        
        if HAS_RASTERIO and dem_file.exists() and slope_file.exists():
            try:
                with rasterio.open(dem_file) as d_src, rasterio.open(slope_file) as s_src:
                    d_grid = d_src.read(1).flatten()
                    s_grid = s_src.read(1).flatten()
                    
                    # Subsample valid land pixels. process_dem writes sea (and land below
                    # MSL) as exactly 0.5 m; > 0 let those in, and they were 34% of rows.
                    valid_mask = (d_grid > 0.5) & (~np.isnan(d_grid)) & (~np.isnan(s_grid))
                    valid_d = d_grid[valid_mask]
                    valid_s = s_grid[valid_mask]
                    
                    if len(valid_d) > 0:
                        idx = np.random.choice(len(valid_d), size=min(2000, len(valid_d)), replace=False)
                        elevations.extend(valid_d[idx])
                        slopes.extend(valid_s[idx])
            except Exception as e:
                logging.warning(f"Could not read {city} DEM rasters: {e}")
                
    if len(elevations) < 500:
        logging.warning("No usable DEM rasters found - substituting UNIFORM RANDOM elevation/slope. Features are fabricated.")
        elevations = np.random.uniform(0.5, 235.0, num_samples)
        slopes = np.random.uniform(0.1, 5.0, num_samples)
    else:
        elevations = np.array(elevations)
        slopes = np.array(slopes)
        
    return elevations, slopes

def generate_synthetic_dataset(num_samples: int = 5000):
    """
    Generate a SYNTHETIC training dataset.

    Features (elevation, slope) are sampled from real 30m CartoDEM rasters when
    available. The TARGET IS NOT OBSERVED OR SIMULATED DATA: it is computed from
    the parametric runoff approximation below. No hydrodynamic solver (EPA-SWMM
    or otherwise) is run anywhere in this project.

    Consequence: a model fitted here can only recover that equation. Its accuracy
    against real flood depths is UNVALIDATED. See README 'Model status'.

    Features: [total_precip_mm, peak_intensity_mm_hr, slope_deg, elevation_m, impermeability_pct]
    Target:   water_level_increase_cm
    """
    np.random.seed(42)
    dem_elevations, dem_slopes = extract_dem_samples_from_rasters(num_samples)
    
    # Resample or match length to num_samples
    idx = np.random.choice(len(dem_elevations), size=num_samples, replace=True)
    elevation = dem_elevations[idx]
    slope = dem_slopes[idx]
    
    # mm total 24 h precip. Up to 120 mm, the forest flat-lined at ~72 cm for any
    # heavier day; IMD "extremely heavy" starts at 204.5 mm/24 h, Mumbai sees more.
    precip = np.random.uniform(0.0, PRECIP_MAX_MM, num_samples)
    peak = precip * np.random.uniform(0.7, 1.8, num_samples) / 3.5 # mm/hr peak intensity
    impermeability = np.random.uniform(45.0, 95.0, num_samples) # Urban surface impermeability (%)

    # Parametric runoff approximation (NOT a physics solver and NOT calibrated
    # against observations). Coefficients are chosen to be directionally plausible:
    # depth rises with precip, intensity and impermeability; falls with slope and elevation.
    water_level_increase_cm = (
        0.42 * precip +
        0.35 * peak +
        0.28 * (impermeability / 10.0) -
        0.95 * slope -
        0.18 * np.log1p(elevation) +
        np.random.normal(0, 0.7, num_samples)
    )
    water_level_increase_cm[water_level_increase_cm < 0] = 0.0

    X = np.column_stack([precip, peak, slope, elevation, impermeability])
    y = water_level_increase_cm
    return X, y

def train_surrogate_model(artifacts_dir: str = "models/artifacts"):
    artifacts_path = Path(artifacts_dir)
    artifacts_path.mkdir(parents=True, exist_ok=True)

    logging.warning("Training on SYNTHETIC targets from a parametric equation - not SWMM, not observed data.")
    X, y = generate_synthetic_dataset(5000)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    logging.info("Training Hydrodynamic Water Level Regressor...")
    model = RandomForestRegressor(n_estimators=120, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    baseline = LinearRegression().fit(X_train, y_train)

    # Held-out scores against the SAME synthetic equation. They show how well the
    # forest copies that equation, not how well it predicts real floods.
    def score(m):
        p = m.predict(X_test)
        return {"r2": round(float(r2_score(y_test, p)), 4),
                "rmse_cm": round(float(np.sqrt(mean_squared_error(y_test, p))), 3)}
    metrics = {
        "target": "synthetic parametric equation (not observed, not SWMM)",
        "rain_horizon_h": 24,
        "precip_range_mm": [0.0, PRECIP_MAX_MM],
        "n_train": len(y_train), "n_test": len(y_test),
        "held_out": {"random_forest": score(model), "linear_baseline": score(baseline)},
    }
    logging.info(f"HELD-OUT (synthetic target): {metrics['held_out']}")
    (artifacts_path / "surrogate_metrics.json").write_text(json.dumps(metrics, indent=2))

    model_file = artifacts_path / "flood_surrogate.pkl"
    with open(model_file, "wb") as f:
        pickle.dump(model, f)

    logging.info(f"Saved surrogate model artifact to {model_file}")
    return model

if __name__ == "__main__":
    train_surrogate_model()

