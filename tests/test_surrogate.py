"""
Regression checks for the surrogate training fixes.

Run:  python tests/test_surrogate.py
"""
import sys
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "models"))
sys.path.insert(0, str(ROOT))

import train_surrogate as T  # noqa: E402
from pipeline.terrain_features import FEATURE_NAMES, build_vector  # noqa: E402

FLAT_LAND = {"slope_deg": 1.0, "elevation_m": 10.0,
             "log_flow_accum": 3.0, "depression_depth_m": 0.0}


def test_training_rows_exclude_sea_cells():
    X, _ = T.generate_synthetic_dataset(2000)
    # process_dem writes sea as exactly 0.5 m; it used to be a third of all rows.
    assert not np.any(X[:, FEATURE_NAMES.index("elevation_m")] == 0.5)


def test_depth_keeps_rising_with_heavy_rain():
    # The old forest, trained on 0-120 mm, returned ~72 cm for 200, 300 and 500 mm.
    with tempfile.TemporaryDirectory() as d:
        model = T.train_surrogate_model(artifacts_dir=d)
        assert (Path(d) / "surrogate_metrics.json").is_file()
    rains = [60, 120, 200, 300, 380]
    depth = [model.predict([build_vector(p, p / 3.5 * 1.25, 80.0, FLAT_LAND)])[0]
             for p in rains]
    assert all(b > a + 5 for a, b in zip(depth, depth[1:])), depth


def test_a_sink_floods_deeper_than_a_ridge_in_the_same_rain():
    # Flow accumulation and depression depth were computed by process_dem and then
    # never reached the model, so every pixel in a city predicted the same depth.
    with tempfile.TemporaryDirectory() as d:
        model = T.train_surrogate_model(artifacts_dir=d)
    ridge = {**FLAT_LAND, "log_flow_accum": 0.0, "depression_depth_m": 0.0}
    sink = {**FLAT_LAND, "log_flow_accum": 11.0, "depression_depth_m": 2.0}
    rain = 150.0
    d_ridge, d_sink = (model.predict([build_vector(rain, rain / 3.5, 80.0, t)])[0]
                       for t in (ridge, sink))
    assert d_sink > d_ridge, (d_ridge, d_sink)


def test_serving_and_training_agree_on_feature_order():
    # A reorder on one side only is silent: the pickle carries no feature names.
    X, _ = T.generate_synthetic_dataset(10)
    assert X.shape[1] == len(FEATURE_NAMES)
    row = build_vector(100.0, 30.0, 70.0, FLAT_LAND)
    assert len(row) == len(FEATURE_NAMES)
    assert row[FEATURE_NAMES.index("depression_depth_m")] == FLAT_LAND["depression_depth_m"]
    assert row[FEATURE_NAMES.index("total_precip_mm")] == 100.0


def test_server_feeds_the_surrogate_24h_of_rain():
    import server.main as M
    om = {"success": True, "hourly_precip": [2.0] * 24}
    assert M.surrogate_rain_inputs(om, 5.0, 1.0) == (48.0, 2.0)
    # without a full 24 h forecast, the caller's own values are used
    assert M.surrogate_rain_inputs({"success": False}, 5.0, 1.0) == (5.0, 1.0)


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all checks passed")
