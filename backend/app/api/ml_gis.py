"""Public read endpoints plus the operator-only pipeline trigger.

Every response carries a `provenance` block (see `app.core.data_status`) saying
whether the numbers are live, heuristic, demo, or unavailable. Endpoints that
cannot produce a real answer now say so instead of returning a plausible
constant.

What changed in the review:

* `is_real_api: true` and `is_real_dem: true` were hardcoded regardless of what
  was on disk. Both are gone; DEM provenance now comes from the processed
  summary file or reports "fallback".
* `/metrics` fabricated verification scores from `np.random`. It now reads a
  verification report produced by `pipeline/evaluate_nowcast.py` and returns
  `unavailable` when no report exists.
* `/telemetry_status` returned a fixed "48/50 sensors". There is no sensor feed,
  so it now reports that plainly.
* `/run_pipeline` returned "COMPLETED" without running anything. It is now
  operator-authenticated and reports what it actually did.
* `/route_check` returned a Mumbai corridor for every city.
"""
from __future__ import annotations

import datetime
import json
import subprocess
import sys
from datetime import timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core import config, data_status as ds
from app.core.paths import (
    NOWCAST_REPORT_FILE,
    PROCESSED_DIR,
    ROOT_DIR,
    drainage_network_file,
    forecast_file,
)
from app.core.security import Operator, require_operator
from app.domain.cities import (
    CITY_TERRAINS,
    DEM_CARTODEM,
    METRO_REGISTRY,
    get_city_terrain,
    get_corridor,
    is_inside_any_city,
    resolve_city_key,
    resolve_ward_info,
)
from app.services import flood_estimate as fe
from app.services.weather import get_weather

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:  # pragma: no cover - environment dependent
    HAS_RASTERIO = False

router = APIRouter(prefix="/api", tags=["forecast"])

FORECAST_WINDOW_HOURS = 12


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _terrain_block(profile: dict[str, Any]) -> dict[str, Any]:
    """Terrain description that states its own provenance."""
    is_real = profile.get("dem_source") == DEM_CARTODEM
    return {
        "city": profile["name"],
        "slope_deg": round(float(profile["slope"]), 3),
        "elevation_m": round(float(profile["elevation"]), 2),
        "impermeability_pct": profile["impermeability"],
        "dem_source": profile.get("dem_source", "fallback"),
        "dem_source_label": profile.get("dem_source_label", "City-scale average"),
        "derived_from_raster": is_real,
    }


def _read_nowcast_raster(lat: float, lon: float) -> dict[str, Any] | None:
    """Sample the pySTEPS nowcast at a point, if a raster has been produced.

    Band labels come from the sidecar the nowcast writes. Without it we do not
    guess the time step - the old code labelled 30-minute IMERG bands as
    "+0, +5, +10 min", which understated the lead times by a factor of six.
    """
    raster_path = forecast_file()
    if not HAS_RASTERIO or not raster_path.is_file():
        return None
    try:
        with rasterio.open(raster_path) as source:
            bounds = source.bounds
            if not (bounds.bottom <= lat <= bounds.top and bounds.left <= lon <= bounds.right):
                return None
            row, col = source.index(lon, lat)
            window = rasterio.windows.Window(col, row, 1, 1)
            values = [round(float(value), 2) for value in source.read(window=window)[:, 0, 0]]
    except Exception as exc:  # noqa: BLE001 - a bad raster must not 500 the API
        print(f"[!] Could not sample nowcast raster: {exc.__class__.__name__}")
        return None

    sidecar = raster_path.with_suffix(".meta.json")
    step_minutes: int | None = None
    produced_at: str | None = None
    if sidecar.is_file():
        try:
            meta = json.loads(sidecar.read_text(encoding="utf-8"))
            step_minutes = meta.get("timestep_minutes")
            produced_at = meta.get("produced_at")
        except (json.JSONDecodeError, OSError):
            pass

    if step_minutes:
        labels = [f"+{(index + 1) * step_minutes} min" for index in range(len(values))]
    else:
        labels = [f"band {index + 1}" for index in range(len(values))]

    return {
        "values_mm_hr": values,
        "labels": labels,
        "timestep_minutes": step_minutes,
        "produced_at": produced_at,
        "path": str(raster_path.relative_to(ROOT_DIR)),
    }


def _forecast_payload(lat: float, lon: float, city_hint: str | None = None) -> dict[str, Any]:
    """The shared rainfall + depth computation behind every forecast endpoint."""
    profile = get_city_terrain(lat, lon, city_hint)
    reading = get_weather(lat, lon, hours=FORECAST_WINDOW_HOURS)

    caveats: list[str] = [ds.NOT_AN_OFFICIAL_WARNING]
    if not is_inside_any_city(lat, lon) and not city_hint:
        caveats.append(
            f"This location is outside every supported city boundary; terrain defaults to "
            f"{profile['name']} and the depth estimate should not be relied on."
        )
    if profile.get("dem_source") != DEM_CARTODEM:
        caveats.append(
            "No processed DEM raster for this city yet, so slope and elevation are city-scale averages."
        )
    if not profile.get("focus", False):
        caveats.append(
            f"{profile['name']} is outside the focus cities "
            f"({', '.join(name.title() for name in config.FOCUS_CITIES)}) and is less well calibrated."
        )

    if not reading.ok:
        return {
            "location": {"lat": lat, "lon": lon, "city": profile["name"]},
            "terrain": _terrain_block(profile),
            "current_weather": None,
            "forecast": None,
            "provenance": ds.envelope(
                ds.UNAVAILABLE,
                method="Open-Meteo hourly forecast",
                caveats=caveats + ["The weather provider could not be reached, so no estimate was produced."],
                upstream_error=reading.error,
            ),
        }

    estimate = fe.estimate_depth(
        hourly_rainfall_mm=reading.hourly_precip_mm,
        slope_deg=float(profile["slope"]),
        elevation_m=float(profile["elevation"]),
        impermeability_pct=float(profile["impermeability"]),
    )
    risk_level = fe.classify_risk(estimate.depth_cm, reading.peak_intensity_mm_hr)
    nowcast = _read_nowcast_raster(lat, lon)

    # Rainfall is live; the depth derived from it usually is not. The response
    # reports the weaker of the two, because that is what the user is shown.
    overall_status = ds.LIVE if estimate.data_status == ds.LIVE else ds.HEURISTIC

    return {
        "location": {"lat": lat, "lon": lon, "city": profile["name"]},
        "terrain": _terrain_block(profile),
        "current_weather": reading.current,
        "forecast": {
            "window_hours": FORECAST_WINDOW_HOURS,
            "rain_expected": reading.total_rainfall_mm > 0.1,
            "total_rainfall_mm": reading.total_rainfall_mm,
            "peak_intensity_mm_hr": reading.peak_intensity_mm_hr,
            "hourly_rainfall_mm": reading.hourly_precip_mm,
            "hourly_labels": reading.hourly_labels,
            "predicted_flood_depth_cm": estimate.depth_cm,
            "depth_method": estimate.method,
            "depth_method_label": estimate.method_label,
            "depth_workings": estimate.inputs,
            "risk_level": risk_level,
        },
        "nowcast_raster": nowcast,
        "provenance": ds.envelope(
            overall_status,
            method=f"Open-Meteo hourly rainfall -> {estimate.method_label}",
            observed_at=reading.observed_at,
            caveats=caveats + estimate.caveats,
            rainfall_source="Open-Meteo forecast API",
            depth_source=estimate.method,
        ),
    }


# ---------------------------------------------------------------------------
# Public read endpoints
# ---------------------------------------------------------------------------

@router.get("/predict")
def predict(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> dict[str, Any]:
    """Rainfall and estimated flood depth for a coordinate."""
    return _forecast_payload(lat, lon)


@router.get("/ward_forecast")
def ward_forecast(
    ward_name: str = Query("Velachery", max_length=120),
    city: str | None = Query(None, max_length=60),
) -> dict[str, Any]:
    """Forecast plus river stage context for a named municipal ward."""
    city_key, ward, matched = resolve_ward_info(ward_name, city)
    payload = _forecast_payload(ward["lat"], ward["lon"], city_key)
    profile = CITY_TERRAINS[city_key]

    caveats = list(payload["provenance"]["caveats"])
    if not matched:
        caveats.insert(0, f"No ward matched '{ward_name}'; showing {ward['name']} instead.")

    forecast = payload.get("forecast")
    depth_cm = forecast["predicted_flood_depth_cm"] if forecast else 0.0
    excess_mm = float(forecast["depth_workings"].get("excess_runoff_mm", 0.0)) if forecast else 0.0

    # River stage: base level plus a documented linear rise with excess runoff,
    # capped at the danger level. This is a placeholder for a real gauge feed,
    # and is labelled heuristic rather than presented as a reading.
    danger_level_m = ward["danger_level_m"]
    base_level_m = ward["base_water_level_m"]
    headroom_m = max(0.0, danger_level_m - base_level_m)
    river_level_m = round(min(danger_level_m + 0.15, base_level_m + excess_mm * 0.012), 2)

    payload.update({
        "ward": {
            "name": ward["name"],
            "code": ward.get("code"),
            "city": profile["name"],
            "city_key": city_key,
            "river_name": ward["river_name"],
            "matched_requested_ward": matched,
        },
        "river": {
            "name": ward["river_name"],
            "estimated_level_m": river_level_m,
            "base_level_m": base_level_m,
            "danger_level_m": danger_level_m,
            "headroom_m": round(max(0.0, danger_level_m - river_level_m), 2),
            "at_or_above_danger": river_level_m >= danger_level_m,
            "data_status": ds.HEURISTIC,
            "note": "Estimated from rainfall, not read from a river gauge. No gauge feed is connected.",
        },
        "pumps": {
            "total_installed": ward["total_pumps"],
            "active": None,
            "data_status": ds.UNAVAILABLE,
            "note": "No pump telemetry feed is connected, so the number running is unknown.",
        },
        "status": forecast["risk_level"] if forecast else "UNKNOWN",
    })
    payload["provenance"]["caveats"] = caveats + [
        "River level and pump status are not live feeds. Headroom shown is "
        f"against a {danger_level_m} m danger level with {headroom_m:.2f} m of nominal range.",
    ]
    return payload


@router.get("/live_nowcast")
def live_nowcast(
    city: str = Query("chennai", max_length=60),
    ward: str | None = Query(None, max_length=120),
    lat: float | None = Query(None, ge=-90, le=90),
    lon: float | None = Query(None, ge=-180, le=180),
) -> dict[str, Any]:
    """Single entry point used by the dashboard."""
    if ward:
        return ward_forecast(ward_name=ward, city=city)
    if lat is not None and lon is not None:
        return _forecast_payload(lat, lon, city)
    city_key = resolve_city_key(city)
    first_ward = next(iter(METRO_REGISTRY[city_key]["wards"].values()))
    return ward_forecast(ward_name=first_ward["name"], city=city_key)


@router.get("/cities")
def cities() -> dict[str, Any]:
    """Supported cities, their wards, and how good the terrain data is."""
    result = []
    for city_key, registry in METRO_REGISTRY.items():
        profile = CITY_TERRAINS.get(city_key, {})
        result.append({
            "key": city_key,
            "name": registry["name"],
            "state": registry["state"],
            "center": registry["center"],
            "focus_city": bool(profile.get("focus", False)),
            "terrain": _terrain_block(profile) if profile else None,
            "corridor": get_corridor(city_key),
            "wards_count": len(registry["wards"]),
            "wards": [
                {
                    "name": ward["name"],
                    "code": ward["code"],
                    "lat": ward["lat"],
                    "lon": ward["lon"],
                    "river_name": ward["river_name"],
                    "danger_level_m": ward["danger_level_m"],
                    "total_pumps": ward["total_pumps"],
                }
                for ward in registry["wards"].values()
            ],
        })
    return {
        "count": len(result),
        "focus_cities": list(config.FOCUS_CITIES),
        "cities": result,
        "provenance": ds.envelope(
            ds.DEMO,
            method="Static city and ward reference table maintained in app/domain/cities.py",
            caveats=[
                "Ward boundaries, danger levels and pump counts are reference values, "
                "not a live municipal asset register.",
            ],
        ),
    }


@router.get("/dem/summary")
def dem_summary(city: str = Query("chennai", max_length=60)) -> dict[str, Any]:
    """Terrain summary for a city, stating whether a raster was processed."""
    city_key = resolve_city_key(city)
    profile = CITY_TERRAINS[city_key]
    is_real = profile.get("dem_source") == DEM_CARTODEM

    return {
        "city": profile["name"],
        "city_key": city_key,
        "terrain": _terrain_block(profile),
        "provenance": ds.envelope(
            ds.LIVE if is_real else ds.HEURISTIC,
            method=(
                "Statistics computed by pipeline/process_dem.py from a DEM raster"
                if is_real
                else "City-scale average; no DEM raster has been processed for this city"
            ),
            caveats=[] if is_real else [
                "Download a CartoDEM or SRTM tile into data/raw/cartodem and run "
                "pipeline/process_dem.py to replace this with real terrain statistics.",
            ],
        ),
    }


@router.get("/drainage/{city}")
def drainage(city: str) -> dict[str, Any]:
    """Schematic drainage network for a city, if one has been extracted."""
    city_key = resolve_city_key(city)
    network_path = drainage_network_file(city_key)

    if not network_path.is_file():
        return {
            "city": CITY_TERRAINS[city_key]["name"],
            "channels": [],
            "provenance": ds.envelope(
                ds.UNAVAILABLE,
                method="pipeline/extract_drainage_network.py",
                caveats=[
                    "No drainage network has been extracted for this city. "
                    "Run the terrain pipeline first.",
                ],
            ),
        }

    try:
        payload = json.loads(network_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The stored drainage network for this city could not be read.",
        ) from None

    payload["provenance"] = ds.envelope(
        ds.HEURISTIC,
        method="Channels traced from terrain flow accumulation",
        caveats=[ds.SCHEMATIC_NETWORK_CAVEAT],
    )
    return payload


@router.get("/metrics")
def metrics() -> dict[str, Any]:
    """Nowcast verification scores, read from a real evaluation run.

    Returns `unavailable` until `pipeline/evaluate_nowcast.py` has been run
    against observations and has written a report. It no longer invents scores.
    """
    if not NOWCAST_REPORT_FILE.is_file():
        return {
            "verification": None,
            "provenance": ds.envelope(
                ds.UNAVAILABLE,
                method="pipeline/evaluate_nowcast.py",
                caveats=[
                    "No verification report exists yet. Scores are only shown after the "
                    "nowcast has been evaluated against held-out observed rainfall.",
                ],
            ),
        }

    try:
        report = json.loads(NOWCAST_REPORT_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The verification report could not be read.",
        ) from None

    return {
        "verification": report,
        "provenance": ds.envelope(
            ds.LIVE,
            method=report.get("method", "pipeline/evaluate_nowcast.py"),
            observed_at=report.get("evaluated_at"),
            caveats=report.get("caveats", []),
        ),
    }


@router.get("/model_status")
def model_status() -> dict[str, Any]:
    """What the depth model actually is right now."""
    info = fe.surrogate_status()
    return {
        "surrogate_installed": info.available,
        "surrogate_validated": info.validated,
        "reason": info.reason,
        "model_card": info.card or None,
        "active_method": "surrogate" if info.validated else "heuristic",
        "heuristic_description": (
            "Rational method over the worst rainfall window, minus a constant drainage "
            "removal rate, ponded over a slope-dependent fraction of the catchment."
        ),
        "provenance": ds.envelope(
            ds.LIVE,
            method="Introspection of the installed model artefact and its card",
        ),
    }


@router.get("/telemetry_status")
def telemetry_status() -> dict[str, Any]:
    """Honest statement of which feeds are actually connected."""
    nowcast_path = forecast_file()
    surrogate = fe.surrogate_status()
    return {
        "feeds": {
            "rainfall_forecast": {
                "connected": True,
                "provider": "Open-Meteo",
                "data_status": ds.LIVE,
                "cache_seconds": config.OPEN_METEO_CACHE_SECONDS,
            },
            "ground_sensors": {
                "connected": False,
                "data_status": ds.UNAVAILABLE,
                "note": "No water-level or rain-gauge sensor network is connected to this deployment.",
            },
            "doppler_radar": {
                "connected": False,
                "data_status": ds.UNAVAILABLE,
                "note": "No IMD Doppler radar feed is connected. The nowcast uses satellite rainfall when present.",
            },
            "pump_telemetry": {
                "connected": False,
                "data_status": ds.UNAVAILABLE,
                "note": "No SCADA or pump-house telemetry is connected.",
            },
            "nowcast_raster": {
                "connected": nowcast_path.is_file(),
                "data_status": ds.LIVE if nowcast_path.is_file() else ds.UNAVAILABLE,
                "note": None if nowcast_path.is_file() else "Run the nowcast pipeline to produce a forecast raster.",
            },
            "depth_model": {
                "connected": surrogate.validated,
                "data_status": ds.LIVE if surrogate.validated else ds.HEURISTIC,
                "note": surrogate.reason,
            },
        },
        "provenance": ds.envelope(
            ds.LIVE,
            method="Direct inspection of configured feeds and on-disk artefacts",
        ),
    }


@router.get("/route_check")
def route_check(
    origin: str = Query("Origin", max_length=120),
    destination: str = Query("Destination", max_length=120),
    city: str = Query("chennai", max_length=60),
    depth_cm: float = Query(0.0, ge=0.0, le=500.0),
) -> dict[str, Any]:
    """Reference elevated corridor for a city, with passability guidance.

    This is *not* a routing engine. It returns the named elevated corridor on
    file for the requested city plus depth-based passability advice. Before the
    review this returned a Mumbai corridor, with a "100% dry" guarantee, for
    every city in the registry.
    """
    city_key = resolve_city_key(city)
    profile = CITY_TERRAINS[city_key]
    corridor = get_corridor(city_key)

    return {
        "city": profile["name"],
        "origin": origin,
        "destination": destination,
        "reported_depth_cm": depth_cm,
        "passability": passability_guidance(depth_cm),
        "suggested_corridor": {
            **corridor,
            "note": "Elevated road on file for this city. Passability is not verified against live conditions.",
        },
        "provenance": ds.envelope(
            ds.DEMO,
            method="Static corridor reference table plus depth thresholds",
            caveats=[
                "No live road network, traffic or closure data is used. Distances and "
                "travel times are not computed.",
                "Follow instructions from traffic police and civic authorities over this screen.",
            ],
        ),
    }


def passability_guidance(depth_cm: float) -> list[dict[str, Any]]:
    """Per-mode guidance from water depth. Thresholds are deliberately cautious.

    Moving water is far more dangerous than still water at the same depth, and
    these thresholds assume still water over a known road surface. An open or
    missing manhole cover is invisible under any depth.
    """
    modes = [
        ("Walking", 15.0, 30.0),
        ("Two-wheeler", 10.0, 20.0),
        ("Car", 15.0, 30.0),
        ("Bus or truck", 30.0, 50.0),
    ]
    guidance = []
    for mode, caution_cm, stop_cm in modes:
        if depth_cm < caution_cm:
            verdict, advice = "passable", "Usually passable with care."
        elif depth_cm < stop_cm:
            verdict, advice = "risky", "Risky. Turn back if the water is moving or you cannot see the road."
        else:
            verdict, advice = "do_not_enter", "Do not enter."
        guidance.append({
            "mode": mode,
            "verdict": verdict,
            "advice": advice,
            "caution_threshold_cm": caution_cm,
            "stop_threshold_cm": stop_cm,
        })
    return guidance


# ---------------------------------------------------------------------------
# Operator-only
# ---------------------------------------------------------------------------

@router.post("/run_pipeline", status_code=status.HTTP_202_ACCEPTED)
def run_pipeline(
    stage: str = Query("terrain", pattern="^(terrain|nowcast)$"),
    city: str = Query("chennai", max_length=60),
    operator: Operator = Depends(require_operator),
) -> dict[str, Any]:
    """Run a pipeline stage for real, and report what happened.

    The previous version accepted GET or POST from anyone and replied
    "COMPLETED" without executing anything.
    """
    city_key = resolve_city_key(city)
    if not operator.may_act_on(city_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is not authorised to act on {city_key}.",
        )

    if stage == "terrain":
        command = [sys.executable, "-m", "pipeline.process_dem", "--city", city_key]
    else:
        command = [
            sys.executable, "-m", "pipeline.nowcast_pysteps",
            "--frames-dir", str(PROCESSED_DIR / "frames" / city_key),
            "--output", str(PROCESSED_DIR / "forecasts"),
        ]

    started_at = datetime.datetime.now(timezone.utc)
    try:
        completed = subprocess.run(  # noqa: S603 - fixed argv, no shell, no user strings
            command,
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
            timeout=900,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"The {stage} pipeline did not complete ({exc.__class__.__name__}).",
        ) from exc

    duration_s = (datetime.datetime.now(timezone.utc) - started_at).total_seconds()
    succeeded = completed.returncode == 0
    # stdout can carry absolute server paths; send only the tail, and only to an
    # authenticated operator.
    tail = (completed.stdout or completed.stderr or "").strip().splitlines()[-5:]

    return {
        "stage": stage,
        "city": city_key,
        "succeeded": succeeded,
        "exit_code": completed.returncode,
        "duration_seconds": round(duration_s, 1),
        "log_tail": tail,
        "triggered_by": operator.username,
        "provenance": ds.envelope(
            ds.LIVE,
            method=f"Executed pipeline stage '{stage}' as a subprocess",
            caveats=[] if succeeded else ["The pipeline stage exited with a non-zero status."],
        ),
    }
