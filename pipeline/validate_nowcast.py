"""
Measure real nowcast skill: forecast from time t, score against what was observed
at t+30/60/90 min.

Method
------
For every launch time with enough history, compute a Lucas-Kanade motion field from
the preceding frames, advect the last observed frame forward, and compare each
forecast lead time against the frame that was actually observed then.

Contingency counts (hits / misses / false alarms) are accumulated across ALL launch
times first, and CSI/POD/FAR are computed from those totals. Averaging per-case CSI
instead would be biased: cases with almost no rain produce degenerate scores that
carry the same weight as a major storm.

A persistence baseline (forecast = last observed frame, unchanged) is scored
alongside. A nowcast that cannot beat persistence has demonstrated nothing, so the
comparison is reported rather than left implicit.

Output
------
JSON: metrics per lead time per threshold, for both the nowcast and persistence.

    python pipeline/validate_nowcast.py --input data/processed/nowcast/forecast.tif \\
        --output data/processed/nowcast_validation.json
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import rasterio

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.evaluate_nowcast import calculate_contingency_metrics  # noqa: E402

DEFAULT_THRESHOLDS = (0.1, 2.5, 10.0)


def _load_contiguity(frames_json, n_frames):
    """
    Per-frame flag: True when frame i follows frame i-1 by exactly one timestep.

    Returns None when the sidecar is absent, so the caller can say the scores are
    unverified rather than quietly assuming continuity.
    """
    if not frames_json.is_file():
        return None
    try:
        meta = json.loads(frames_json.read_text())
        times = [datetime.fromisoformat(t) for t in meta["frame_times"]]
        step = float(meta.get("timestep_minutes", 30))
    except (ValueError, KeyError, TypeError):
        return None
    if len(times) != n_frames:
        return None
    flags = [False] + [
        abs((times[i] - times[i - 1]).total_seconds() / 60.0 - step) < 1e-6
        for i in range(1, n_frames)
    ]
    return flags


def _skill_from_counts(counts, threshold):
    """CSI/POD/FAR from accumulated contingency totals."""
    hits, misses, fa = counts["hits"], counts["misses"], counts["false_alarms"]
    csi_d, pod_d, far_d = hits + misses + fa, hits + misses, hits + fa
    n = counts["n_pairs"]
    return {
        "threshold_mm_hr": threshold,
        "hits": hits,
        "misses": misses,
        "false_alarms": fa,
        "correct_negatives": counts["correct_negatives"],
        "CSI": round(hits / csi_d, 4) if csi_d else None,
        "POD": round(hits / pod_d, 4) if pod_d else None,
        "FAR": round(fa / far_d, 4) if far_d else None,
        "RMSE": round(float(np.sqrt(counts["se"] / counts["n_px"])), 4) if counts["n_px"] else None,
        "n_forecast_pairs": n,
    }


def _accumulate(counts, obs, pred, threshold):
    m = calculate_contingency_metrics(obs, pred, threshold=threshold)
    counts["hits"] += m["hits"]
    counts["misses"] += m["misses"]
    counts["false_alarms"] += m["false_alarms"]
    counts["correct_negatives"] += m["correct_negatives"]
    counts["se"] += float(np.sum((pred - obs) ** 2))
    counts["n_px"] += obs.size
    counts["n_pairs"] += 1


def validate(tif_path, leadtimes=3, history=4, thresholds=DEFAULT_THRESHOLDS, stride=1, max_launches=None):
    from pysteps.motion.lucaskanade import dense_lucaskanade
    from pysteps.extrapolation.semilagrangian import extrapolate

    with rasterio.open(tif_path) as src:
        frames = src.read().astype(np.float32)
    n_frames, rows, cols = frames.shape
    if min(rows, cols) < 40:
        raise ValueError(
            f"Domain is {rows}x{cols}; optical flow needs at least 40x40. "
            "Re-ingest with a wider --domain-deg."
        )

    frames = np.nan_to_num(frames, nan=0.0)
    frames[frames < 0] = 0.0

    blank = lambda: {"hits": 0, "misses": 0, "false_alarms": 0, "correct_negatives": 0,
                     "se": 0.0, "n_px": 0, "n_pairs": 0}
    nowcast_counts = {(l, t): blank() for l in range(1, leadtimes + 1) for t in thresholds}
    persist_counts = {(l, t): blank() for l in range(1, leadtimes + 1) for t in thresholds}

    contiguous = _load_contiguity(Path(tif_path).parent / "frames.json", n_frames)

    launches = list(range(history - 1, n_frames - leadtimes, stride))
    if max_launches:
        launches = launches[:max_launches]
    print(f"{n_frames} frames of {rows}x{cols}; {len(launches)} candidate launches, "
          f"{leadtimes} lead times, thresholds {list(thresholds)}")
    if contiguous is None:
        print("  WARNING: no frames.json; cannot verify frames are one timestep apart.")
        print("           Scores may mix real gaps into the forecast interval.")

    used = skipped_dry = skipped_gap = failed = 0
    edge_excluded_px = []
    for i, t in enumerate(launches, 1):
        # Every frame from the start of the motion window to the last verified lead
        # time must be one clean timestep from its predecessor.
        if contiguous is not None and not all(
            contiguous[j] for j in range(t - history + 2, t + leadtimes + 1)
        ):
            skipped_gap += 1
            continue

        window = frames[t - history + 1 : t + 1]
        if window.max() <= thresholds[0]:
            skipped_dry += 1          # no rain to track; motion is undefined
            continue
        try:
            motion = dense_lucaskanade(window)
            fc_raw = extrapolate(window[-1], motion, leadtimes)
            # Semi-Lagrangian advection has no information for cells that flow in from
            # outside the domain; it marks them NaN. Zeroing them would score the
            # nowcast as predicting "no rain" there, a penalty persistence never pays.
            # Exclude those cells from scoring for BOTH forecasts instead.
            valid = ~np.isnan(fc_raw)
            fc = np.nan_to_num(fc_raw, nan=0.0)
        except Exception as exc:
            failed += 1
            if failed <= 3:
                print(f"  launch {t}: {type(exc).__name__}: {exc}")
            continue

        fc[fc < 0] = 0.0
        for lead in range(1, leadtimes + 1):
            mask = valid[lead - 1]
            if mask.sum() == 0:
                continue
            obs = frames[t + lead][mask]
            pred_nc = fc[lead - 1][mask]
            pred_pe = window[-1][mask]
            edge_excluded_px.append(int((~mask).sum()))
            for th in thresholds:
                _accumulate(nowcast_counts[(lead, th)], obs, pred_nc, th)
                _accumulate(persist_counts[(lead, th)], obs, pred_pe, th)
        used += 1
        if i % 20 == 0 or i == len(launches):
            print(f"  {i}/{len(launches)} launches processed")

    print(f"scored {used} launches; skipped {skipped_dry} dry, "
          f"{skipped_gap} spanning time gaps, {failed} failed")
    if used == 0:
        raise RuntimeError("No launch times could be scored - nothing to report.")

    def table(counts):
        return {
            f"lead_{lead * 30}min": {
                f"threshold_{th}mm_hr": _skill_from_counts(counts[(lead, th)], th)
                for th in thresholds
            }
            for lead in range(1, leadtimes + 1)
        }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "method": "pySTEPS Lucas-Kanade optical flow + semi-Lagrangian extrapolation",
        "source_raster": str(tif_path),
        "domain_px": [rows, cols],
        "timestep_minutes": 30,
        "launches_scored": used,
        "launches_skipped_dry": skipped_dry,
        "launches_skipped_time_gap": skipped_gap,
        "continuity_verified": contiguous is not None,
        "launches_failed": failed,
        "mean_edge_cells_excluded": (
            round(float(np.mean(edge_excluded_px)), 1) if edge_excluded_px else 0
        ),
        "domain_cells": rows * cols,
        "history_frames": history,
        "nowcast": table(nowcast_counts),
        "persistence_baseline": table(persist_counts),
        "note": (
            "Contingency counts are pooled across all launch times before computing "
            "CSI/POD/FAR. Persistence is the last observed frame held constant; the "
            "nowcast is only informative where it beats it. Cells with no advection "
            "information (inflow from outside the domain) are excluded from BOTH "
            "forecasts so neither is scored on cells the other did not have to predict."
        ),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--input", required=True, help="multiband GeoTIFF of observed frames (from ingest_imerg)")
    ap.add_argument("--output", required=True, help="where to write the metrics JSON")
    ap.add_argument("--leadtimes", type=int, default=3, help="forecast steps to score (default 3 = 90 min)")
    ap.add_argument("--history", type=int, default=4, help="frames used for the motion field (default 4)")
    ap.add_argument("--stride", type=int, default=1, help="step between launch times (default 1)")
    ap.add_argument("--max-launches", type=int, help="cap launches (for a quick test)")
    args = ap.parse_args()

    result = validate(args.input, args.leadtimes, args.history,
                      stride=args.stride, max_launches=args.max_launches)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2))
    print(f"\nwrote {out}")

    print("\nCSI by lead time (threshold 0.1 mm/hr):")
    print(f"  {'lead':<10} {'nowcast':>9} {'persistence':>13}")
    for lead in sorted(result["nowcast"], key=lambda k: int(k.split("_")[1].rstrip("min"))):
        n = result["nowcast"][lead]["threshold_0.1mm_hr"]["CSI"]
        p = result["persistence_baseline"][lead]["threshold_0.1mm_hr"]["CSI"]
        print(f"  {lead:<10} {n if n is not None else '-':>9} {p if p is not None else '-':>13}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
