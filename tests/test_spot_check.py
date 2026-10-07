"""
Boundary checks for the crossing-safety verdict and ward resolution.

Run:  python -m pytest tests/ -q      (or just: python tests/test_spot_check.py)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.main import crossing_verdict, resolve_ward_info


def test_verdict_thresholds():
    # Boundaries are inclusive on the lower edge of each band.
    assert crossing_verdict(0.0)[0] == "CLEAR"
    assert crossing_verdict(4.9)[0] == "CLEAR"
    assert crossing_verdict(5.0)[0] == "CAUTION"
    assert crossing_verdict(14.9)[0] == "CAUTION"
    assert crossing_verdict(15.0)[0] == "UNSAFE"
    assert crossing_verdict(29.9)[0] == "UNSAFE"
    assert crossing_verdict(30.0)[0] == "IMPASSABLE"
    assert crossing_verdict(500.0)[0] == "IMPASSABLE"


def test_verdict_without_live_data_is_unknown_not_clear():
    # The whole point of the fix: no data must never read as "safe".
    assert crossing_verdict(0.0, live_data=False)[0] == "UNKNOWN"
    assert crossing_verdict(99.0, live_data=False)[0] == "UNKNOWN"


def test_unknown_ward_returns_none_not_a_substitute():
    assert resolve_ward_info("Nowhere-ville") == (None, None)
    assert resolve_ward_info("") == (None, None)
    # Too short to match loosely: must not silently pick the first ward containing "a".
    assert resolve_ward_info("a") == (None, None)


def test_known_ward_resolves():
    city, ward = resolve_ward_info("Velachery")
    assert city == "chennai"
    assert ward["name"] == "Velachery"
    # Case-insensitive and partial, but only when specific enough.
    assert resolve_ward_info("velachery")[1]["name"] == "Velachery"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all checks passed")
