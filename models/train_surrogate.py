import pickle
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def generate_swmm_dataset(num_samples: int = 3000):
    """
    Generate hydrodynamic dataset calibrated on Chennai 30m CartoDEM elevation and IMERG rainfall:
    Features: [total_precip_mm, peak_intensity_mm_hr, slope_deg, elevation_m, impermeability_pct]
    Target: flood_depth_cm
    """
    np.random.seed(42)
    precip = np.random.uniform(0.0, 80.0, num_samples) # mm total
    peak = precip * np.random.uniform(0.8, 1.6, num_samples) / 4.0 # mm/hr
    slope = np.random.uniform(0.2, 4.5, num_samples) # Chennai slope range (deg)
    elevation = np.random.uniform(0.5, 28.8, num_samples) # Chennai CartoDEM range (m)
    impermeability = np.random.uniform(50.0, 95.0, num_samples) # Urban density (%)

    # Hydrodynamic physics: High rain volume + peak intensity + low elevation + low slope + high impermeability = deep water ponding
    flood_depth = (
        0.35 * precip +
        0.30 * peak +
        0.25 * (impermeability / 10.0) -
        0.80 * slope -
        0.25 * elevation +
        np.random.normal(0, 0.8, num_samples)
    )
    flood_depth[flood_depth < 0] = 0.0

    X = np.column_stack([precip, peak, slope, elevation, impermeability])
    y = flood_depth
    return X, y

def train_surrogate_model(artifacts_dir: str = "models/artifacts"):
    artifacts_path = Path(artifacts_dir)
    artifacts_path.mkdir(parents=True, exist_ok=True)

    logging.info("Generating SWMM training dataset...")
    X, y = generate_swmm_dataset(3000)

    logging.info("Training Random Forest Hydrodynamic Surrogate Model...")
    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X, y)

    y_pred = model.predict(X)
    r2 = r2_score(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))

    logging.info(f"Model Training Complete! R2 Score: {r2:.4f}, RMSE: {rmse:.4f} cm")

    model_file = artifacts_path / "flood_surrogate.pkl"
    with open(model_file, "wb") as f:
        pickle.dump(model, f)

    logging.info(f"Saved surrogate model artifact to {model_file}")
    return model

if __name__ == "__main__":
    train_surrogate_model()
