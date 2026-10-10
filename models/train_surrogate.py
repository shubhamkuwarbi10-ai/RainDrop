import json
import pickle
import sys
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import logging

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.terrain_features import (  # noqa: E402
    FEATURE_NAMES, TERRAIN_RASTERS, load_training_samples,
)

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

PRECIP_MAX_MM = 400.0  # trees cannot extrapolate: predictions plateau above this


def _fallback_terrain(num_samples, rng):
    """Uniform random terrain, used only when no DEM rasters are readable."""
    logging.warning("No usable DEM rasters - substituting UNIFORM RANDOM terrain. "
                    "Features are fabricated, not sampled from CartoDEM.")
    return {
        "elevation_m": rng.uniform(0.5, 235.0, num_samples),
        "slope_deg": rng.uniform(0.1, 5.0, num_samples),
        "log_flow_accum": rng.uniform(0.0, 12.0, num_samples),
        "depression_depth_m": np.where(rng.random(num_samples) < 0.2,
                                       rng.uniform(0.0, 2.0, num_samples), 0.0),
    }


def generate_synthetic_dataset(num_samples: int = 5000):
    """
    Generate a SYNTHETIC training dataset.

    Terrain features are sampled from real 30m CartoDEM rasters when available, all
    four fields taken from the SAME pixels so their correlation survives. The TARGET
    IS STILL NOT OBSERVED OR SIMULATED DATA: it comes from the parametric runoff
    approximation below. No hydrodynamic solver (EPA-SWMM, SFINCS or otherwise) runs
    anywhere in this project.

    Consequence, unchanged by this file's growth: a model fitted here can only
    recover that equation. Its accuracy against real flood depths is UNVALIDATED.
    See README 'Model status'.

    Features: see pipeline.terrain_features.FEATURE_NAMES
    Target:   water_level_increase_cm
    """
    rng = np.random.default_rng(42)
    terrain = load_training_samples(rng=rng) or _fallback_terrain(num_samples, rng)

    idx = rng.choice(len(terrain["elevation_m"]), size=num_samples, replace=True)
    elevation = terrain["elevation_m"][idx]
    slope = terrain["slope_deg"][idx]
    log_flow_accum = terrain["log_flow_accum"][idx]
    depression_depth = terrain["depression_depth_m"][idx]

    # mm total 24 h precip. Up to 120 mm, the forest flat-lined at ~72 cm for any
    # heavier day; IMD "extremely heavy" starts at 204.5 mm/24 h, Mumbai sees more.
    precip = rng.uniform(0.0, PRECIP_MAX_MM, num_samples)
    peak = precip * rng.uniform(0.7, 1.8, num_samples) / 3.5  # mm/hr peak intensity
    impermeability = rng.uniform(45.0, 95.0, num_samples)     # urban surface (%)

    # Parametric runoff approximation (NOT a physics solver and NOT calibrated
    # against observations). Two stages, both chosen to be directionally plausible
    # rather than fitted to anything:
    #
    #   runoff        how much water the rain puts on this pixel. Rises with precip,
    #                 intensity and impermeability; falls with slope and elevation.
    #   concentration what the terrain then does with it. Upslope contributing area
    #                 brings more water in; a depression stops it leaving. Applied as
    #                 a MULTIPLIER because terrain redistributes runoff rather than
    #                 adding to it -- which also makes the target genuinely
    #                 non-linear, so "does the forest beat a straight line" finally
    #                 becomes a real question instead of a foregone conclusion.
    runoff = (
        0.42 * precip +
        0.35 * peak +
        0.28 * (impermeability / 10.0) -
        0.95 * slope -
        0.18 * np.log1p(elevation)
    )
    concentration = 1.0 + 0.055 * log_flow_accum + 0.30 * depression_depth
    water_level_increase_cm = (
        np.clip(runoff, 0.0, None) * concentration + rng.normal(0, 0.7, num_samples)
    )
    water_level_increase_cm[water_level_increase_cm < 0] = 0.0

    X = np.column_stack([precip, peak, slope, elevation, impermeability,
                         log_flow_accum, depression_depth])
    assert X.shape[1] == len(FEATURE_NAMES), "feature vector drifted from FEATURE_NAMES"
    return X, water_level_increase_cm


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
    # forest copies that equation, not how well it predicts real floods. The split
    # is random over rows; with real solver output it would have to be by scenario
    # and spatial block, because neighbouring pixels are near-duplicates.
    def score(m):
        p = m.predict(X_test)
        return {"r2": round(float(r2_score(y_test, p)), 4),
                "rmse_cm": round(float(np.sqrt(mean_squared_error(y_test, p))), 3)}

    metrics = {
        "target": "synthetic parametric equation (not observed, not SWMM)",
        "features": list(FEATURE_NAMES),
        "terrain_source": f"per-pixel CartoDEM rasters ({', '.join(TERRAIN_RASTERS)})",
        "rain_horizon_h": 24,
        "precip_range_mm": [0.0, PRECIP_MAX_MM],
        "n_train": len(y_train), "n_test": len(y_test),
        "held_out": {"random_forest": score(model), "linear_baseline": score(baseline)},
        "feature_importance": {n: round(float(i), 4)
                               for n, i in zip(FEATURE_NAMES, model.feature_importances_)},
    }
    logging.info(f"HELD-OUT (synthetic target): {metrics['held_out']}")
    logging.info(f"FEATURE IMPORTANCE: {metrics['feature_importance']}")
    (artifacts_path / "surrogate_metrics.json").write_text(json.dumps(metrics, indent=2))

    model_file = artifacts_path / "flood_surrogate.pkl"
    with open(model_file, "wb") as f:
        pickle.dump(model, f)

    logging.info(f"Saved surrogate model artifact to {model_file}")
    return model


if __name__ == "__main__":
    train_surrogate_model()
