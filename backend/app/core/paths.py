"""Single source of truth for every on-disk path the backend reads.

Every module must import these constants instead of rebuilding a relative path.
Mismatched paths were why the pipeline wrote forecasts the API never found.
"""
from pathlib import Path

# .../backend/app/core/paths.py -> parents[3] is the repository root.
ROOT_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
FORECASTS_DIR = PROCESSED_DIR / "forecasts"
TERRAIN_DIR = PROCESSED_DIR / "terrain"
MODELS_DIR = ROOT_DIR / "models"
ARTIFACTS_DIR = MODELS_DIR / "artifacts"
CLIENT_DIR = ROOT_DIR / "client"
REPORTS_DIR = ROOT_DIR / "reports"
# Mutable runtime state (operator credentials). Mounted as a named volume in
# docker-compose so it survives a rebuild and is not baked into the image.
STATE_DIR = DATA_DIR / "state"

# Canonical artefact names.
FORECAST_FILE = FORECASTS_DIR / "pysteps_forecast.tif"
SURROGATE_MODEL_FILE = ARTIFACTS_DIR / "flood_surrogate.pkl"
SURROGATE_CARD_FILE = ARTIFACTS_DIR / "flood_surrogate.model_card.json"
NOWCAST_REPORT_FILE = REPORTS_DIR / "nowcast_verification.json"
OPERATORS_FILE = STATE_DIR / "operators.json"


def _resolve(name: str) -> Path:
    """Prefer the canonical terrain folder, fall back to the older flat layout."""
    canonical = TERRAIN_DIR / name
    if canonical.exists():
        return canonical
    legacy = PROCESSED_DIR / name
    return legacy if legacy.exists() else canonical


def dem_summary_file(city_key: str) -> Path:
    return _resolve(f"{city_key}_dem_summary.json")


def drainage_network_file(city_key: str) -> Path:
    return _resolve(f"{city_key}_drainage_network.json")


def forecast_file() -> Path:
    """Canonical nowcast raster, falling back to the pre-refactor location."""
    if FORECAST_FILE.exists():
        return FORECAST_FILE
    legacy = PROCESSED_DIR / "pysteps_forecast.tif"
    return legacy if legacy.exists() else FORECAST_FILE


def ensure_dirs() -> None:
    for directory in (RAW_DIR, PROCESSED_DIR, FORECASTS_DIR, TERRAIN_DIR, ARTIFACTS_DIR, REPORTS_DIR, STATE_DIR):
        directory.mkdir(parents=True, exist_ok=True)
