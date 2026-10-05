"""Verify a rainfall nowcast against observations.

Three changes after review:

1. **Undefined is not perfect.** CSI, POD and FAR were returning 1.0, 1.0 and
   0.0 when there were no events to score. A dry fortnight therefore produced a
   flawless scorecard. Undefined scores are now `None` and the report says how
   many cases were skipped.

2. **A score needs a baseline.** A nowcast is only useful if it beats
   persistence: repeating the last observed frame. Every metric is reported
   alongside the persistence score and the skill gain over it. Without this,
   "CSI 0.85" tells a judge nothing.

3. **Scores are per lead time.** A nowcast that is good at +30 min and useless
   at +3 h is normal, and averaging the two hides it.

Running this module writes reports/nowcast_verification.json, which is the only
thing /api/metrics will serve. Nothing here invents data: with no observations
to compare against, it refuses to produce a report.
"""
from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("evaluate_nowcast")

ROOT = Path(__file__).resolve().parent.parent
REPORT_PATH = ROOT / "reports" / "nowcast_verification.json"

# Rain-rate thresholds in mm/hr. 1.0 is "is it raining", 5.0 is meaningful
# rain, 10.0 is the level at which urban drainage starts to struggle.
DEFAULT_THRESHOLDS = (1.0, 5.0, 10.0)


def contingency_scores(observed: np.ndarray, predicted: np.ndarray, threshold: float) -> dict:
    """2x2 contingency scores at one threshold.

    Returns None for any score whose denominator is zero. That is the honest
    answer: with no observed events there is nothing to detect, so POD is
    undefined rather than perfect.
    """
    observed = np.asarray(observed, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    valid = np.isfinite(observed) & np.isfinite(predicted)

    observed_event = (observed >= threshold) & valid
    predicted_event = (predicted >= threshold) & valid

    hits = int(np.sum(observed_event & predicted_event))
    false_alarms = int(np.sum(~observed_event & predicted_event & valid))
    misses = int(np.sum(observed_event & ~predicted_event))
    correct_negatives = int(np.sum(~observed_event & ~predicted_event & valid))

    csi = hits / (hits + misses + false_alarms) if (hits + misses + false_alarms) > 0 else None
    pod = hits / (hits + misses) if (hits + misses) > 0 else None
    far = false_alarms / (hits + false_alarms) if (hits + false_alarms) > 0 else None
    bias = (hits + false_alarms) / (hits + misses) if (hits + misses) > 0 else None

    return {
        "threshold_mm_hr": threshold,
        "hits": hits,
        "false_alarms": false_alarms,
        "misses": misses,
        "correct_negatives": correct_negatives,
        "observed_events": hits + misses,
        "CSI": round(csi, 4) if csi is not None else None,
        "POD": round(pod, 4) if pod is not None else None,
        "FAR": round(far, 4) if far is not None else None,
        "frequency_bias": round(bias, 4) if bias is not None else None,
        "undefined_reason": None if (hits + misses) > 0 else "No observed events at this threshold.",
    }


def continuous_scores(observed: np.ndarray, predicted: np.ndarray) -> dict:
    observed = np.asarray(observed, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    valid = np.isfinite(observed) & np.isfinite(predicted)
    if not valid.any():
        return {"RMSE_mm_hr": None, "MAE_mm_hr": None, "mean_error_mm_hr": None, "n": 0}
    error = predicted[valid] - observed[valid]
    return {
        "RMSE_mm_hr": round(float(np.sqrt(np.mean(error ** 2))), 4),
        "MAE_mm_hr": round(float(np.mean(np.abs(error))), 4),
        "mean_error_mm_hr": round(float(np.mean(error)), 4),
        "n": int(valid.sum()),
    }


def evaluate_lead_time(
    observed: np.ndarray,
    predicted: np.ndarray,
    persistence: np.ndarray | None = None,
    thresholds=DEFAULT_THRESHOLDS,
) -> dict:
    """Score one lead time against observations, and against persistence."""
    result = {
        "categorical": [contingency_scores(observed, predicted, t) for t in thresholds],
        "continuous": continuous_scores(observed, predicted),
    }

    if persistence is None:
        result["baseline"] = None
        result["skill_vs_persistence"] = None
        return result

    baseline = {
        "categorical": [contingency_scores(observed, persistence, t) for t in thresholds],
        "continuous": continuous_scores(observed, persistence),
    }
    result["baseline"] = {"name": "persistence (last observed frame repeated)", **baseline}

    # Skill = fractional improvement over the baseline. Negative means the
    # nowcast is worse than doing nothing, which is worth knowing.
    model_rmse = result["continuous"]["RMSE_mm_hr"]
    base_rmse = baseline["continuous"]["RMSE_mm_hr"]
    rmse_skill = (
        round(1 - model_rmse / base_rmse, 4)
        if model_rmse is not None and base_rmse not in (None, 0)
        else None
    )
    csi_gain = []
    for model_row, base_row in zip(result["categorical"], baseline["categorical"]):
        if model_row["CSI"] is None or base_row["CSI"] is None:
            csi_gain.append({"threshold_mm_hr": model_row["threshold_mm_hr"], "csi_gain": None})
        else:
            csi_gain.append({
                "threshold_mm_hr": model_row["threshold_mm_hr"],
                "csi_gain": round(model_row["CSI"] - base_row["CSI"], 4),
            })

    result["skill_vs_persistence"] = {"rmse_skill_score": rmse_skill, "csi_gain": csi_gain}
    return result


def evaluate_predictions(observed, predicted, thresholds=DEFAULT_THRESHOLDS) -> dict:
    """Backwards-compatible single-field evaluation."""
    return {
        f"threshold_{threshold}mm_hr": contingency_scores(observed, predicted, threshold)
        for threshold in thresholds
    }


def build_report(
    forecast_stack: np.ndarray,
    observed_stack: np.ndarray,
    last_observed_frame: np.ndarray,
    timestep_minutes: int,
    source: str,
    thresholds=DEFAULT_THRESHOLDS,
) -> dict:
    """Score every lead time and assemble the report /api/metrics serves."""
    if forecast_stack.shape != observed_stack.shape:
        raise ValueError(
            f"Forecast and observation stacks differ: {forecast_stack.shape} vs {observed_stack.shape}"
        )

    lead_times = []
    for index in range(forecast_stack.shape[0]):
        scores = evaluate_lead_time(
            observed_stack[index], forecast_stack[index], last_observed_frame, thresholds
        )
        scores["lead_time_minutes"] = (index + 1) * timestep_minutes
        lead_times.append(scores)

    total_events = sum(
        row["observed_events"]
        for lead in lead_times
        for row in lead["categorical"]
        if row["threshold_mm_hr"] == thresholds[0]
    )

    caveats = [
        "Scores are against the observations supplied to this run only, not a long record.",
        "Undefined scores are reported as null, never as 1.0.",
    ]
    if total_events == 0:
        caveats.insert(0, "No rainfall events were observed in this period, so the categorical scores are undefined.")

    return {
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "method": f"Lead-time verification of {source} against observed rainfall, with a persistence baseline",
        "source": source,
        "timestep_minutes": timestep_minutes,
        "thresholds_mm_hr": list(thresholds),
        "lead_times": lead_times,
        "observed_events_at_lowest_threshold": int(total_events),
        "caveats": caveats,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a nowcast against observations.")
    parser.add_argument("--forecast", type=Path, required=True,
                        help="Multi-band GeoTIFF of predicted rain rates, one band per lead time.")
    parser.add_argument("--observed", type=Path, required=True,
                        help="Multi-band GeoTIFF of observed rain rates for the same valid times.")
    parser.add_argument("--timestep-minutes", type=int, default=30)
    parser.add_argument("--output", type=Path, default=REPORT_PATH)
    args = parser.parse_args()

    try:
        import rasterio
    except ImportError:
        log.error("rasterio is required to read the forecast and observation rasters.")
        return 1

    for path in (args.forecast, args.observed):
        if not path.is_file():
            log.error("Not found: %s", path)
            log.error("This script will not produce a report without real observations to compare against.")
            return 1

    with rasterio.open(args.forecast) as source:
        forecast_stack = source.read().astype(np.float32)
    with rasterio.open(args.observed) as source:
        observed_stack = source.read().astype(np.float32)

    # Persistence baseline: the frame immediately before the forecast period.
    last_observed = observed_stack[0]

    report = build_report(
        forecast_stack, observed_stack, last_observed,
        args.timestep_minutes, source=args.forecast.name,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    log.info("Wrote %s", args.output)

    for lead in report["lead_times"]:
        first = lead["categorical"][0]
        skill = lead.get("skill_vs_persistence") or {}
        log.info(
            "+%d min: CSI@%.1f=%s  RMSE=%s  skill vs persistence=%s",
            lead["lead_time_minutes"], first["threshold_mm_hr"], first["CSI"],
            lead["continuous"]["RMSE_mm_hr"], skill.get("rmse_skill_score"),
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
