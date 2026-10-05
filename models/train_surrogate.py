"""Train the flood-depth surrogate, and report what it is actually worth.

WHAT WAS WRONG BEFORE
=====================

The previous script reported R2 = 0.9994 and that number was meaningless three
times over:

1. *Circular labels.* The target was
   `0.42*precip + 0.35*peak + 0.28*(imperv/10) - 0.95*slope - 0.18*log1p(elev)
   + noise` - a closed-form function of the same five features given to the
   model. A random forest relearning a smooth function of its own inputs scores
   R2 ~ 1.0 by construction. The docstring said the labels came from SWMM; SWMM
   was never run.

2. *No held-out set.* The score came from `model.predict(X)` on the training
   rows. A random forest with max_depth=10 on 5000 points substantially
   memorises them.

3. *No baseline.* Even a true held-out R2 means nothing without knowing what a
   constant predictor or a simple formula scores on the same split.

WHAT THIS SCRIPT DOES
=====================

* Trains only on labels from `models/swmm_labels.py`, which runs EPA SWMM. If
  no label file exists it stops and says so, rather than generating labels from
  a formula.
* Splits by **storm event and by city**, never by row. Neighbouring rows from
  the same storm are near-duplicates, so a random split leaks the answer across
  the split and inflates every score.
* Scores three baselines on the identical split: the training mean, the
  rational-method heuristic the API falls back to, and a rain-threshold rule.
  A surrogate that cannot beat all three is not worth deploying.
* Reports MAE and RMSE in centimetres, because that is the unit of the decision
  the user makes. R2 is reported too, but secondary.
* Writes a model card next to the artefact containing its SHA-256, the split
  definition, every score, and an explicit statement of what the model has NOT
  been validated against. The backend refuses to load an artefact whose hash
  does not match this card.

Usage:
    python models/swmm_labels.py --city chennai --scenarios 400
    python models/swmm_labels.py --city mumbai  --scenarios 400
    python models/swmm_labels.py --city delhi   --scenarios 400
    python models/train_surrogate.py --holdout-city delhi
"""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import pickle
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
# The rational-method baseline is the backend's own heuristic, imported so the
# comparison is against the code that actually runs in production.
sys.path.insert(0, str(ROOT_DIR / "backend"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("train_surrogate")

ROOT = ROOT_DIR
LABELS_DIR = ROOT / "data" / "processed" / "labels"
ARTIFACTS_DIR = ROOT / "models" / "artifacts"

FEATURES = [
    "total_rainfall_mm",
    "peak_intensity_mm_hr",
    "ground_slope_pct",
    "impervious_pct",
    "design_storm_mm_hr",
]
TARGET = "label_flood_depth_cm"


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_labels() -> tuple[list[dict], dict]:
    """Load every SWMM label file. Refuses to invent data."""
    files = sorted(LABELS_DIR.glob("*_swmm_labels.json")) if LABELS_DIR.exists() else []
    if not files:
        raise SystemExit(
            f"No SWMM label files in {LABELS_DIR}.\n\n"
            "Generate them first:\n"
            "    pip install pyswmm\n"
            "    python models/swmm_labels.py --city chennai --scenarios 400\n"
            "    python models/swmm_labels.py --city mumbai  --scenarios 400\n"
            "    python models/swmm_labels.py --city delhi   --scenarios 400\n\n"
            "This script will not fall back to formula-generated labels. A model trained on "
            "a formula of its own inputs scores near-perfectly and means nothing."
        )

    rows: list[dict] = []
    provenance: dict = {"files": [], "network_is_schematic": False}
    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        rows.extend(payload["rows"])
        provenance["files"].append({
            "file": path.name,
            "city": payload.get("city"),
            "scenarios": payload.get("scenarios"),
            "simulator": payload.get("simulator"),
            "generated_at": payload.get("generated_at"),
        })
        provenance["network_is_schematic"] = (
            provenance["network_is_schematic"] or bool(payload.get("network_is_schematic"))
        )
        provenance.setdefault("assumptions", payload.get("assumptions"))

    log.info("Loaded %d labelled scenarios from %d file(s).", len(rows), len(files))
    return rows, provenance


def to_matrix(rows: list[dict]) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    features = np.array([[float(row[name]) for name in FEATURES] for row in rows])
    target = np.array([float(row[TARGET]) for row in rows])
    cities = np.array([row["city"] for row in rows])
    shapes = np.array([row.get("storm_shape", "unknown") for row in rows])
    return features, target, cities, shapes


# ---------------------------------------------------------------------------
# Splitting
# ---------------------------------------------------------------------------

def make_split(cities, shapes, holdout_city: str | None, holdout_shape: str, seed: int):
    """Hold out a whole city and a whole storm type.

    Holding out a city tests whether the model transfers to terrain and drainage
    it has never seen, which is what deploying to a new city actually asks of
    it. Holding out a storm shape tests whether it learned the physics of
    timing rather than memorising the shapes in the training set.
    """
    test_mask = np.zeros(len(cities), dtype=bool)
    description = []

    if holdout_city:
        if holdout_city not in set(cities):
            raise SystemExit(f"Hold-out city '{holdout_city}' has no labels. Available: {sorted(set(cities))}")
        test_mask |= cities == holdout_city
        description.append(f"all scenarios for {holdout_city}")

    if holdout_shape in set(shapes):
        test_mask |= shapes == holdout_shape
        description.append(f"all '{holdout_shape}' storms in every city")

    if not test_mask.any():
        # Fall back to a grouped split by storm shape, still never by row.
        generator = np.random.default_rng(seed)
        unique_shapes = sorted(set(shapes))
        chosen = generator.choice(unique_shapes, size=max(1, len(unique_shapes) // 4), replace=False)
        test_mask = np.isin(shapes, chosen)
        description.append(f"storm shapes {sorted(chosen)}")

    if test_mask.all():
        raise SystemExit("The hold-out covers every row; nothing is left to train on.")

    return ~test_mask, test_mask, " and ".join(description)


# ---------------------------------------------------------------------------
# Baselines
# ---------------------------------------------------------------------------

def baseline_mean(train_target, test_features):
    """Predict the training mean for everything. The floor any model must clear."""
    return np.full(len(test_features), float(np.mean(train_target)))


def baseline_rational_method(test_features):
    """The heuristic the API falls back to, scored on the same rows.

    If the trained model cannot beat this, the model is not earning its keep and
    the heuristic should simply be kept.
    """
    from app.services.flood_estimate import heuristic_depth_cm

    predictions = []
    for row in test_features:
        total_mm, peak_mm_hr, slope_pct, impervious_pct, design_mm_hr = row
        # Rebuild an hourly series with the same total and peak.
        remaining = max(0.0, total_mm - peak_mm_hr)
        series = [peak_mm_hr] + [remaining / 5.0] * 5
        depth, _ = heuristic_depth_cm(
            hourly_rainfall_mm=series,
            impermeability_pct=impervious_pct,
            # The labels carry ground slope in percent; the heuristic wants degrees.
            slope_deg=float(np.degrees(np.arctan(slope_pct / 100.0))),
            drain_rate_mm_hr=design_mm_hr,
        )
        predictions.append(depth)
    return np.array(predictions)


def baseline_rain_threshold(test_features):
    """If the peak hour exceeds the design storm, call it 20 cm, else 0.

    Deliberately crude: a rule an engineer could apply on paper.
    """
    peak = test_features[:, 1]
    design = test_features[:, 4]
    return np.where(peak > design, 20.0, 0.0)


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score(actual, predicted) -> dict:
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    error = predicted - actual
    total_variance = float(np.sum((actual - actual.mean()) ** 2))
    r2 = 1 - float(np.sum(error ** 2)) / total_variance if total_variance > 0 else None
    return {
        "mae_cm": round(float(np.mean(np.abs(error))), 3),
        "rmse_cm": round(float(np.sqrt(np.mean(error ** 2))), 3),
        "bias_cm": round(float(np.mean(error)), 3),
        "r2": round(r2, 4) if r2 is not None else None,
        "n": int(len(actual)),
    }


def train(holdout_city: str | None, holdout_shape: str, seed: int) -> dict:
    from sklearn.ensemble import RandomForestRegressor

    rows, provenance = load_labels()
    features, target, cities, shapes = to_matrix(rows)
    train_mask, test_mask, split_description = make_split(cities, shapes, holdout_city, holdout_shape, seed)

    train_features, train_target = features[train_mask], target[train_mask]
    test_features, test_target = features[test_mask], target[test_mask]
    log.info("Split: hold out %s", split_description)
    log.info("Train on %d rows, test on %d rows.", len(train_target), len(test_target))

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=3,
        random_state=seed,
        n_jobs=-1,
    )
    model.fit(train_features, train_target)

    results = {
        "surrogate": score(test_target, model.predict(test_features)),
        "baseline_training_mean": score(test_target, baseline_mean(train_target, test_features)),
        "baseline_rational_method": score(test_target, baseline_rational_method(test_features)),
        "baseline_rain_threshold": score(test_target, baseline_rain_threshold(test_features)),
        # Reported only to show the gap against the held-out score. A large gap
        # is overfitting, and this is the number the old script published alone.
        "surrogate_on_training_data_do_not_quote": score(train_target, model.predict(train_features)),
    }

    log.info("")
    log.info("%-40s %8s %8s", "", "MAE cm", "RMSE cm")
    for name, result in results.items():
        log.info("%-40s %8.2f %8.2f", name, result["mae_cm"], result["rmse_cm"])

    best_baseline = min(
        (results[name]["mae_cm"] for name in
         ("baseline_training_mean", "baseline_rational_method", "baseline_rain_threshold")),
    )
    beats_baselines = results["surrogate"]["mae_cm"] < best_baseline
    log.info("")
    if beats_baselines:
        improvement = (1 - results["surrogate"]["mae_cm"] / best_baseline) * 100
        log.info("Surrogate beats the best baseline by %.1f%% MAE.", improvement)
    else:
        log.warning(
            "Surrogate does NOT beat the best baseline (MAE %.2f vs %.2f). "
            "Keep the heuristic and do not deploy this model.",
            results["surrogate"]["mae_cm"], best_baseline,
        )

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    artefact_path = ARTIFACTS_DIR / "flood_surrogate.pkl"
    with artefact_path.open("wb") as handle:
        pickle.dump(model, handle)

    digest = hashlib.sha256(artefact_path.read_bytes()).hexdigest()

    card = {
        "model_name": "RandomForest flood-depth surrogate of EPA SWMM",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "artifact": artefact_path.name,
        # The backend verifies this before unpickling: a swapped artefact fails closed.
        "artifact_sha256": digest,
        "features": FEATURES,
        "target": f"{TARGET} (centimetres)",
        "training_data": provenance,
        "hyperparameters": {
            "n_estimators": 300, "max_depth": 12, "min_samples_leaf": 3, "random_state": seed,
        },
        "validation": {
            "held_out_evaluated": True,
            "labels_are_synthetic": False,
            "label_source": "EPA SWMM simulation",
            "split": split_description,
            "split_type": "grouped by city and storm shape, never by row",
            "train_rows": int(len(train_target)),
            "test_rows": int(len(test_target)),
            "mae_cm": results["surrogate"]["mae_cm"],
            "rmse_cm": results["surrogate"]["rmse_cm"],
            "r2": results["surrogate"]["r2"],
            "beats_all_baselines": bool(beats_baselines),
            "baselines": {
                name: results[name] for name in
                ("baseline_training_mean", "baseline_rational_method", "baseline_rain_threshold")
            },
            "training_data_score_for_comparison_only": results["surrogate_on_training_data_do_not_quote"],
        },
        "not_validated_against": [
            "Observed flood depths. No measured flood-depth dataset has been used.",
            "Sentinel-1 SAR flood extents or municipal waterlogging-hotspot records.",
            "The real municipal storm-drain network: the SWMM model is schematic.",
        ],
        "intended_use": (
            "A fast approximation of the SWMM model it was trained on, for screening which "
            "wards need attention. It is not a substitute for a hydraulic study, and its "
            "error against real floods is unknown."
        ),
        "known_limitations": [
            "Trained on single-subcatchment SWMM runs; it does not represent network routing "
            "between catchments.",
            "Depth is derived from SWMM flood volume spread over a DEM-derived ponding area. "
            "That conversion is an assumption.",
            "No tide, river backwater or blocked-drain effects.",
            f"Rainfall totals outside {float(np.min(features[:, 0])):.0f}-{float(np.max(features[:, 0])):.0f} mm "
            "are extrapolation; a random forest returns a flat value there.",
        ],
    }

    card_path = ARTIFACTS_DIR / "flood_surrogate.model_card.json"
    card_path.write_text(json.dumps(card, indent=2), encoding="utf-8")
    log.info("Wrote %s and %s", artefact_path.name, card_path.name)
    log.info("SHA-256: %s", digest)
    return card


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the flood-depth surrogate with an honest hold-out.")
    parser.add_argument("--holdout-city", default=None,
                        help="City to hold out entirely. Tests transfer to unseen terrain.")
    parser.add_argument("--holdout-shape", default="double_peak",
                        help="Storm shape to hold out in every city.")
    parser.add_argument("--seed", type=int, default=20260101)
    args = parser.parse_args()

    train(args.holdout_city, args.holdout_shape, args.seed)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
