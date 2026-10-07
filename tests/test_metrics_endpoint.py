"""
/api/metrics must report measured results or admit it has none.

It previously ran CSI/POD/FAR over two np.random arrays and returned the result as
the model's verification metrics. These tests pin the replacement behaviour.

Run:  python tests/test_metrics_endpoint.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi import HTTPException  # noqa: E402

import server.main as M  # noqa: E402


def test_missing_results_raises_503_instead_of_inventing():
    original = M.VALIDATION_FILE
    try:
        M.VALIDATION_FILE = ROOT / "data" / "processed" / "does_not_exist.json"
        try:
            M.get_model_verification_metrics()
        except HTTPException as exc:
            assert exc.status_code == 503, exc.status_code
            assert "validate_nowcast" in exc.detail
            return
        raise AssertionError("returned metrics with no validation file present")
    finally:
        M.VALIDATION_FILE = original


def test_reports_measured_results_when_present():
    if not M.VALIDATION_FILE.is_file():
        print("skip  test_reports_measured_results_when_present (no validation file yet)")
        return

    r = M.get_model_verification_metrics()
    assert r["measured"] is True
    assert r["verification_metrics"], "no nowcast metrics returned"
    assert r["persistence_baseline"], "a skill score without its baseline is not interpretable"
    assert r["evaluation"]["launches_scored"] > 0

    # Values must come from the file on disk, not be synthesised in the handler.
    disk = json.loads(M.VALIDATION_FILE.read_text())
    assert r["verification_metrics"] == disk["nowcast"]
    assert r["persistence_baseline"] == disk["persistence_baseline"]


def test_skill_decays_with_lead_time():
    """A nowcast whose skill does not fall with lead time is a red flag."""
    if not M.VALIDATION_FILE.is_file():
        print("skip  test_skill_decays_with_lead_time (no validation file yet)")
        return

    nc = json.loads(M.VALIDATION_FILE.read_text())["nowcast"]
    for threshold in ("threshold_0.1mm_hr", "threshold_2.5mm_hr", "threshold_10.0mm_hr"):
        csi = [nc[f"lead_{m}min"][threshold]["CSI"] for m in (30, 60, 90)]
        if any(c is None for c in csi):
            continue
        assert csi[0] > csi[1] > csi[2], f"{threshold}: CSI should decay with lead time, got {csi}"


def test_no_fabricated_metrics_remain_in_server():
    """The old endpoint seeded np.random and scored noise against itself."""
    src = (ROOT / "server" / "main.py").read_text(encoding="utf-8")
    start = src.index("def get_model_verification_metrics")
    # Bound to this function only: stop at the next route decorator, otherwise the
    # slice runs into /api/predict, which legitimately uses numpy.
    nxt = src.find("\n@app.", start)
    body = src[start : nxt if nxt != -1 else len(src)]

    # Skip the docstring: it names the old behaviour on purpose, and matching prose
    # would make this test fail on its own explanation.
    opened = body.find('"""')
    if opened != -1:
        closed = body.find('"""', opened + 3)
        if closed != -1:
            body = body[:opened] + body[closed + 3 :]

    for banned in ("np.random", "random.seed", "exponential("):
        assert banned not in body, f"{banned!r} is back in the metrics endpoint code"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("all checks passed")
