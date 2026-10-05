"""Flood-depth estimation, with its provenance attached.

Two paths, and the caller is always told which one ran:

* **surrogate** - a trained model artefact is installed *and* its model card
  reports a held-out validation score. Only then do we call it a model
  prediction.
* **heuristic** - the documented fallback below. This is the rational method
  plus a storage deficit, which is a recognised engineering screening method,
  not a fitted model. It replaced `0.4 * rain + 0.2 * peak - 1`, a formula with
  no units, no derivation, and no source.

Heuristic assumptions, all of which are approximations a reviewer should
challenge:

* Runoff coefficient C = 0.2 + 0.7 * impervious_fraction (same relation as
  `terrain_processing.estimate_runoff`, so the two agree).
* Storm drains remove water at a constant design rate while it rains. Indian
  urban drainage is commonly designed for a 12-25 mm/hr storm; we assume 15
  mm/hr unless the city profile overrides it, and apply no allowance for drains
  that are silted, surcharged or tide-locked.
* Excess runoff does not spread evenly. It collects in the low-lying fraction
  of the catchment, taken as 6-18% depending on slope. Flatter ground ponds over
  a smaller fraction and therefore deeper.
* No routing, no time of concentration, no backwater from rivers or tides.

The output is therefore an order-of-magnitude estimate for the *wettest part* of
a ward, not a street-level water level.
"""
from __future__ import annotations

import hashlib
import json
import pickle
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from app.core.paths import SURROGATE_CARD_FILE, SURROGATE_MODEL_FILE

# Effective (not design) drainage removal rate. Indian urban storm drains are
# commonly designed for 12-25 mm/hr, but deliver less once silted, surcharged or
# tide-locked. 12 mm/hr is a deliberately conservative working figure.
DEFAULT_DRAIN_RATE_MM_HR = 12.0

# Longest window considered when looking for the critical rainfall duration.
MAX_CRITICAL_WINDOW_HOURS = 6

# Depth bands, in cm, shared with the frontend risk scale.
RISK_BANDS = (
    (0.5, "NONE"),
    (7.0, "LOW"),
    (15.0, "MODERATE"),
    (30.0, "HIGH"),
)
SEVERE = "SEVERE"


@dataclass
class DepthEstimate:
    depth_cm: float
    method: str
    method_label: str
    data_status: str
    caveats: list[str] = field(default_factory=list)
    inputs: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Surrogate model loading
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SurrogateInfo:
    available: bool
    validated: bool
    reason: str
    card: dict[str, Any] = field(default_factory=dict)


def _sha256(path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


@lru_cache(maxsize=1)
def load_surrogate() -> tuple[Any | None, SurrogateInfo]:
    """Load the surrogate only if its hash matches the model card.

    `pickle.load` executes whatever the file tells it to. The card is written by
    `models/train_surrogate.py` next to the artefact and pins its SHA-256, so a
    swapped or truncated artefact fails closed rather than running.
    """
    if not SURROGATE_MODEL_FILE.is_file():
        return None, SurrogateInfo(False, False, "No surrogate artefact is installed.")
    if not SURROGATE_CARD_FILE.is_file():
        return None, SurrogateInfo(
            False, False,
            "Surrogate artefact present but its model card is missing, so it is not loaded.",
        )
    try:
        card = json.loads(SURROGATE_CARD_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None, SurrogateInfo(False, False, "Model card could not be read.")

    expected = card.get("artifact_sha256", "")
    if not expected or _sha256(SURROGATE_MODEL_FILE) != expected:
        return None, SurrogateInfo(
            False, False,
            "Surrogate artefact does not match the SHA-256 in its model card; refusing to load it.",
            card,
        )

    try:
        with SURROGATE_MODEL_FILE.open("rb") as handle:
            model = pickle.load(handle)
    except Exception as exc:  # noqa: BLE001 - any unpickling failure must fail closed
        return None, SurrogateInfo(False, False, f"Surrogate failed to load ({exc.__class__.__name__}).", card)

    validation = card.get("validation", {})
    validated = bool(validation.get("held_out_evaluated")) and not validation.get("labels_are_synthetic", True)
    reason = (
        "Trained surrogate loaded and validated on held-out data."
        if validated
        else "Trained surrogate loaded, but its labels are synthetic or it has no held-out score, "
             "so its output is reported as a heuristic."
    )
    return model, SurrogateInfo(True, validated, reason, card)


def surrogate_status() -> SurrogateInfo:
    return load_surrogate()[1]


# ---------------------------------------------------------------------------
# Heuristic
# ---------------------------------------------------------------------------

def _ponding_fraction(slope_deg: float) -> float:
    """Share of the catchment that collects the excess runoff.

    Flat ground (<0.5 deg) ponds over a small fraction and therefore deeper;
    steep ground sheds water across a wider area before it accumulates.
    """
    if slope_deg <= 0.5:
        return 0.06
    if slope_deg >= 3.0:
        return 0.18
    return 0.06 + (slope_deg - 0.5) * (0.12 / 2.5)


def heuristic_depth_cm(
    hourly_rainfall_mm: list[float],
    impermeability_pct: float,
    slope_deg: float,
    drain_rate_mm_hr: float = DEFAULT_DRAIN_RATE_MM_HR,
    max_window_hours: int = MAX_CRITICAL_WINDOW_HOURS,
) -> tuple[float, dict[str, float]]:
    """Rational method over the worst rainfall window. Returns (depth_cm, workings).

    Urban pluvial flooding is driven by intensity over a short critical
    duration, not by a daily total: 100 mm spread over 24 h drains away, the
    same 100 mm in 3 h does not. So we scan every window from 1 h up to
    `max_window_hours`, compute the runoff the drains cannot carry in that
    window, and keep the worst one.
    """
    series = [max(0.0, float(value)) for value in hourly_rainfall_mm]
    impervious_fraction = min(1.0, max(0.0, impermeability_pct / 100.0))
    runoff_coefficient = 0.2 + 0.7 * impervious_fraction
    fraction = _ponding_fraction(slope_deg)

    worst_excess_mm = 0.0
    worst_window_hours = 0
    worst_window_rain_mm = 0.0

    for window in range(1, min(max_window_hours, len(series)) + 1):
        drain_capacity_mm = drain_rate_mm_hr * window
        for start in range(0, len(series) - window + 1):
            window_rain_mm = sum(series[start:start + window])
            excess_mm = window_rain_mm * runoff_coefficient - drain_capacity_mm
            if excess_mm > worst_excess_mm:
                worst_excess_mm = excess_mm
                worst_window_hours = window
                worst_window_rain_mm = window_rain_mm

    depth_cm = (worst_excess_mm / fraction) / 10.0

    workings = {
        "runoff_coefficient": round(runoff_coefficient, 3),
        "critical_window_hours": worst_window_hours,
        "critical_window_rain_mm": round(worst_window_rain_mm, 2),
        "drain_capacity_mm": round(drain_rate_mm_hr * max(1, worst_window_hours), 2),
        "excess_runoff_mm": round(worst_excess_mm, 2),
        "ponding_area_fraction": round(fraction, 3),
    }
    return round(depth_cm, 1), workings


def classify_risk(depth_cm: float, peak_intensity_mm_hr: float = 0.0) -> str:
    """Depth band, raised one step when the rain itself is intense."""
    level = SEVERE
    for threshold, name in RISK_BANDS:
        if depth_cm < threshold:
            level = name
            break
    if peak_intensity_mm_hr >= 30.0 and level in {"NONE", "LOW", "MODERATE"}:
        return "HIGH"
    if peak_intensity_mm_hr >= 15.0 and level in {"NONE", "LOW"}:
        return "MODERATE"
    return level


def estimate_depth(
    hourly_rainfall_mm: list[float],
    slope_deg: float,
    elevation_m: float,
    impermeability_pct: float,
    drain_rate_mm_hr: float = DEFAULT_DRAIN_RATE_MM_HR,
) -> DepthEstimate:
    """Produce a depth estimate and say honestly where it came from."""
    series = [max(0.0, float(value)) for value in hourly_rainfall_mm]
    total_rainfall_mm = round(sum(series), 2)
    peak_intensity_mm_hr = round(max(series), 2) if series else 0.0
    model, info = load_surrogate()

    if model is not None and info.validated:
        try:
            import numpy as np

            features = np.array([[
                total_rainfall_mm, peak_intensity_mm_hr, slope_deg, elevation_m, impermeability_pct,
            ]])
            depth = max(0.0, round(float(model.predict(features)[0]), 1))
            return DepthEstimate(
                depth_cm=depth,
                method="surrogate",
                method_label=info.card.get("model_name", "Trained flood-depth surrogate"),
                data_status="live",
                caveats=[
                    f"Held-out MAE {info.card.get('validation', {}).get('mae_cm', 'unknown')} cm "
                    f"on {info.card.get('validation', {}).get('split', 'an unnamed split')}.",
                ],
                inputs={
                    "total_rainfall_mm": total_rainfall_mm,
                    "peak_intensity_mm_hr": peak_intensity_mm_hr,
                    "slope_deg": slope_deg,
                    "elevation_m": elevation_m,
                    "impermeability_pct": impermeability_pct,
                },
            )
        except Exception as exc:  # noqa: BLE001 - fall back rather than 500
            print(f"[!] Surrogate inference failed, using heuristic: {exc.__class__.__name__}")

    depth, workings = heuristic_depth_cm(
        hourly_rainfall_mm=series,
        impermeability_pct=impermeability_pct,
        slope_deg=slope_deg,
        drain_rate_mm_hr=drain_rate_mm_hr,
    )
    caveats = [
        "Rational method with a constant drainage design rate and a slope-based ponding "
        "fraction. Not a trained model and not validated against observed floods.",
        info.reason,
    ]
    return DepthEstimate(
        depth_cm=depth,
        method="heuristic",
        method_label="Rational method + storage deficit",
        data_status="heuristic",
        caveats=caveats,
        inputs={
            "total_rainfall_mm": total_rainfall_mm,
            "peak_intensity_mm_hr": peak_intensity_mm_hr,
            "slope_deg": slope_deg,
            "impermeability_pct": impermeability_pct,
            "drain_rate_mm_hr": drain_rate_mm_hr,
            **workings,
        },
    )
