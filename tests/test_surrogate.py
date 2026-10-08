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


def test_training_rows_exclude_sea_cells():
    X, _ = T.generate_synthetic_dataset(2000)
    # process_dem writes sea as exactly 0.5 m; it used to be a third of all rows.
    assert not np.any(X[:, 3] == 0.5)


def test_depth_keeps_rising_with_heavy_rain():
    # The old forest, trained on 0-120 mm, returned ~72 cm for 200, 300 and 500 mm.
    with tempfile.TemporaryDirectory() as d:
        model = T.train_surrogate_model(artifacts_dir=d)
        assert (Path(d) / "surrogate_metrics.json").is_file()
    rains = [60, 120, 200, 300, 380]
    depth = [model.predict([[p, p / 3.5 * 1.25, 1.0, 10.0, 80.0]])[0] for p in rains]
    assert all(b > a + 5 for a, b in zip(depth, depth[1:])), depth


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
