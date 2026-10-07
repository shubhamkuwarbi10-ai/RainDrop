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


METHOD_LABELS = {
    "extrapolation": "Lucas-Kanade + semi-Lagrangian extrapolation (raw mm/h)",
    "extrapolation_db": "Lucas-Kanade + semi-Lagrangian extrapolation (dB)",
    "sprog": "S-PROG: scale-dependent AR(2) nowcast in dB",
}


def validate(tif_path, leadtimes=3, history=4, thresholds=DEFAULT_THRESHOLDS, stride=1,
             max_launches=None, methods=None, primary=None):
    from pipeline.nowcast_pysteps import DEFAULT_METHOD, METHODS, make_forecast

    methods = list(methods or METHODS)
    primary = primary or (DEFAULT_METHOD if DEFAULT_METHOD in methods else methods[0])
    unknown = [m for m in methods if m not in METHODS]
    if unknown:
        raise ValueError(f"Unknown methods {unknown}; choose from {METHODS}")
    if primary not in methods:
        raise ValueError(f"primary method {primary!r} is not among the evaluated methods")

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
    keys = [(l, t) for l in range(1, leadtimes + 1) for t in thresholds]
    counts = {m: {k: blank() for k in keys} for m in methods}
    persist_counts = {k: blank() for k in keys}

    contiguous = _load_contiguity(Path(tif_path).parent / "frames.json", n_frames)

    launches = list(range(history - 1, n_frames - leadtimes, stride))
    if max_launches:
        launches = launches[:max_launches]
    print(f"{n_frames} frames of {rows}x{cols}; {len(launches)} candidate launches, "
          f"{leadtimes} lead times, thresholds {list(thresholds)}")
    print(f"methods: {methods}  (primary: {primary})")
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

        # Run every method before scoring any of them. If one fails, the launch is
        # dropped for all, so every method is scored on the same set of launches.
        forecasts = {}
        try:
            for m in methods:
                fc, _ = make_forecast(window, leadtimes, method=m)
                forecasts[m] = fc
        except Exception as exc:
            failed += 1
            if failed <= 3:
                print(f"  launch {t} ({m}): {type(exc).__name__}: {exc}")
            continue

        # Methods leave NaN where they had no information (inflow from outside the
        # domain), and each leaves it in different places. Score every method AND
        # persistence on the intersection, so no method is graded on cells another
        # was excused from -- otherwise the comparison measures masks, not skill.
        valid = np.ones((leadtimes, rows, cols), dtype=bool)
        for fc in forecasts.values():
            valid &= ~np.isnan(fc)

        for lead in range(1, leadtimes + 1):
            mask = valid[lead - 1]
            if mask.sum() == 0:
                continue
            obs = frames[t + lead][mask]
            edge_excluded_px.append(int((~mask).sum()))
            for th in thresholds:
                _accumulate(persist_counts[(lead, th)], obs, window[-1][mask], th)
                for m, fc in forecasts.items():
                    pred = np.clip(fc[lead - 1][mask], 0.0, None)
                    _accumulate(counts[m][(lead, th)], obs, pred, th)
        used += 1
        if i % 20 == 0 or i == len(launches):
            print(f"  {i}/{len(launches)} launches processed")

    print(f"scored {used} launches; skipped {skipped_dry} dry, "
          f"{skipped_gap} spanning time gaps, {failed} failed")
    if used == 0:
        raise RuntimeError("No launch times could be scored - nothing to report.")

    def table(c):
        return {
            f"lead_{lead * 30}min": {
                f"threshold_{th}mm_hr": _skill_from_counts(c[(lead, th)], th)
                for th in thresholds
            }
            for lead in range(1, leadtimes + 1)
        }

    method_tables = {m: table(counts[m]) for m in methods}
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "method": METHOD_LABELS.get(primary, primary),
        "primary_method": primary,
        "methods_evaluated": methods,
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
        "nowcast": method_tables[primary],
        "methods": method_tables,
        "persistence_baseline": table(persist_counts),
        "note": (
            "Contingency counts are pooled across all launch times before computing "
            "CSI/POD/FAR. Persistence is the last observed frame held constant; a "
            "nowcast is only informative where it beats it. Every method and the "
            "persistence baseline are scored on the same launches and the same cells: "
            "cells any method could not inform (inflow from outside the domain) are "
            "excluded from all of them."
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
    ap.add_argument("--methods", nargs="+",
                    help="methods to evaluate side by side (default: all)")
    ap.add_argument("--primary", help="method reported as 'nowcast' (default: sprog)")
    args = ap.parse_args()

    result = validate(args.input, args.leadtimes, args.history,
                      stride=args.stride, max_launches=args.max_launches,
                      methods=args.methods, primary=args.primary)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2))
    print(f"\nwrote {out}")

    leads = sorted(result["persistence_baseline"],
                   key=lambda k: int(k.split("_")[1].rstrip("min")))
    names = result["methods_evaluated"]
    for th in ("threshold_0.1mm_hr", "threshold_2.5mm_hr", "threshold_10.0mm_hr"):
        print(f"\nCSI, {th.split('_')[1]}:")
        print(f"  {'lead':<11}" + "".join(f"{n:>18}" for n in names) + f"{'persistence':>14}")
        for lead in leads:
            row = f"  {lead:<11}"
            for n in names:
                v = result["methods"][n][lead][th]["CSI"]
                row += f"{(f'{v:.4f}' if v is not None else '-'):>18}"
            pv = result["persistence_baseline"][lead][th]["CSI"]
            row += f"{(f'{pv:.4f}' if pv is not None else '-'):>14}"
            print(row)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
