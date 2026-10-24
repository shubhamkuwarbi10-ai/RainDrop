"""
make_forecast is the single forecasting path for both serving and validation.

Needs pysteps, which cannot be installed on the Windows host here, so these tests
skip there and run in the nowcast image:

    docker run --rm -v "%cd%:/app" raindrop-nowcast python tests/test_make_forecast.py
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from pipeline.nowcast_pysteps import HAS_PYSTEPS, METHODS, make_forecast  # noqa: E402

KNOWN_U = 2  # px per timestep, eastward


def _storm(steps=4):
    """A rain field translating a known KNOWN_U px/step, with dry gaps to track."""
    field = np.random.default_rng(0).gamma(1.0, 2.0, (80, 80))
    field[field < 1.0] = 0.0
    return np.stack([np.roll(field, i * KNOWN_U, axis=1) for i in range(steps)])


def test_every_method_recovers_the_injected_motion():
    if not HAS_PYSTEPS:
        print("skip  test_every_method_recovers_the_injected_motion (no pysteps)")
        return
    for method in METHODS:
        fc, motion = make_forecast(_storm(), 3, method=method)
        u, v = float(np.median(motion[0])), float(np.median(motion[1]))
        assert abs(u - KNOWN_U) < 0.5 and abs(v) < 0.5, f"{method}: motion u={u:.2f} v={v:.2f}"
        assert fc.shape == (3, 80, 80), f"{method}: shape {fc.shape}"


def test_output_is_mm_per_hour_not_db():
    """dB methods must invert the transform. A dB field would hold negative values."""
    if not HAS_PYSTEPS:
        print("skip  test_output_is_mm_per_hour_not_db (no pysteps)")
        return
    for method in METHODS:
        fc, _ = make_forecast(_storm(), 3, method=method)
        finite = fc[np.isfinite(fc)]
        assert finite.min() >= 0.0, f"{method}: negative rain {finite.min():.2f} - still in dB?"
        assert finite.max() < 200.0, f"{method}: {finite.max():.1f} mm/h is implausible"


def test_inflow_cells_stay_nan_for_the_caller():
    """Validation excludes cells with no information; zeroing them here would hide them."""
    if not HAS_PYSTEPS:
        print("skip  test_inflow_cells_stay_nan_for_the_caller (no pysteps)")
        return
    fc, _ = make_forecast(_storm(), 3, method="extrapolation")
    assert np.isnan(fc).any(), "advection from outside the domain should leave NaN"


def test_unknown_method_is_rejected():
    try:
        make_forecast(_storm(), 3, method="magic")
    except ValueError:
        return
    raise AssertionError("an unknown method must raise, not fall back silently")


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all checks passed")
