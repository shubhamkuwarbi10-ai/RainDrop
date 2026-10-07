"""
Regression checks for the hydrology fixes.

Run:  python tests/test_hydrology.py
"""
import sys
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from pipeline.extract_drainage_network import trace_streams  # noqa: E402
from pipeline.process_dem import (  # noqa: E402
    calculate_d8_flow_direction, calculate_flow_accumulation, downstream_index, fill_depressions,
)


def _terrain(n=200):
    yy, xx = np.mgrid[0:n, 0:n]
    return 200 - 0.05 * xx - 0.03 * yy + 3 * np.sin(xx / 20) * np.cos(yy / 15)


def test_flow_accumulation_propagates_upstream():
    # Two cells drain into the centre, which drains south. The old code counted
    # orthogonal neighbours with any flow direction and never propagated.
    fd = np.array([[2, 0, 8], [0, 4, 0], [0, 0, 0]], dtype=np.uint8)
    acc = calculate_flow_accumulation(fd)
    assert acc[1, 1] == 3 and acc[2, 1] == 4, acc


def test_flow_accumulation_conserves_every_cell():
    fd = calculate_d8_flow_direction(fill_depressions(_terrain()))
    acc = calculate_flow_accumulation(fd)
    outlets = downstream_index(fd) < 0
    # Each cell's water is counted exactly once, at whichever outlet it reaches.
    assert int(acc.ravel()[outlets].sum()) == fd.size


def test_fill_raises_pit_to_spill_level():
    z = np.array([[9, 9, 9, 9], [9, 1, 6, 9], [9, 6, 6, 9], [9, 9, 9, 0]], dtype=float)
    f = fill_depressions(z)
    assert 6.0 < f[1, 1] < 6.0001, f[1, 1]


def test_filled_surface_has_no_interior_dead_ends():
    rng = np.random.default_rng(0)
    noisy = _terrain() + rng.normal(0, 2.0, (200, 200))   # rough surface, full of pits
    before = (calculate_d8_flow_direction(noisy)[1:-1, 1:-1] == 0).mean()
    after = (calculate_d8_flow_direction(fill_depressions(noisy))[1:-1, 1:-1] == 0).mean()
    assert before > 0.01 and after == 0.0, (before, after)


def test_traced_streams_follow_flow_downhill():
    # The old extractor joined cells in raster scan order, not along the flow.
    z = fill_depressions(_terrain())
    fd = calculate_d8_flow_direction(z)
    acc = calculate_flow_accumulation(fd)
    down, cols = downstream_index(fd), fd.shape[1]
    lines = trace_streams(fd, acc, min_cells=200)
    assert lines
    for line in lines:
        for (r1, c1), (r2, c2) in zip(line, line[1:]):
            assert down[r1 * cols + c1] == r2 * cols + c2, "step does not follow D8"
            assert z[r2, c2] < z[r1, c1], "step goes uphill"


def test_runoff_is_reported_in_litres_per_second():
    from app.services.terrain_processing import estimate_runoff
    # 10 mm on 1 ha at C = 0.2 + 0.7 * 1.0 = 0.9 -> 90 m3 over 3600 s = 25 L/s
    r = estimate_runoff(rainfall_mm=10, duration_minutes=60, catchment_area_m2=10_000,
                        impervious_fraction=1.0)
    assert abs(r["average_runoff_lps"] - 25.0) < 1e-9, r["average_runoff_lps"]


def test_nowcast_rates_are_accumulated_not_summed():
    import rasterio
    from rasterio.transform import from_bounds
    import server.main as M

    tmp = Path(tempfile.mkdtemp()) / "pysteps_forecast.tif"
    with rasterio.open(tmp, "w", driver="GTiff", height=4, width=4, count=2, dtype="float32",
                       crs="EPSG:4326", transform=from_bounds(80.0, 13.0, 80.4, 13.4, 4, 4)) as dst:
        dst.write(np.full((2, 4, 4), 10.0, dtype=np.float32))   # 10 mm/h for two 30-min steps

    saved = (M.FORECAST_FILE, M.fetch_open_meteo_weather)
    try:
        M.FORECAST_FILE = tmp
        M.fetch_open_meteo_weather = lambda lat, lon: {"success": False}
        fc = M.predict_rainfall(lat=13.2, lon=80.2)["forecast"]
    finally:
        M.FORECAST_FILE, M.fetch_open_meteo_weather = saved

    assert fc["total_rainfall_mm"] == 10.0, fc["total_rainfall_mm"]     # 10 mm/h x 1 h, not 20
    assert fc["timeseries_labels"] == ["+30 min", "+60 min"], fc["timeseries_labels"]


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all checks passed")
