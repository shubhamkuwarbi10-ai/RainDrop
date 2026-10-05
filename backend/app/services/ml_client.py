"""Persist a forecast into PostGIS.

This used to issue an HTTP request to ML_API_URL, which pointed back at this
same process. Under a single worker that deadlocks: the request handler blocks
waiting for a response only that handler could serve. The forecast function is
in this codebase, so we call it directly.
"""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from geoalchemy2.elements import WKTElement

from app.api.ml_gis import predict
from app.db.session import SessionLocal
from app.models.tables import Forecast
from app.schemas.common import GeoPoint, MLSyncResponse

_MAX_FORECAST_ROWS = 288  # 24 h at 5-minute resolution; a sane upper bound.


def _forecast_time(label: str | None, generated_at: datetime, index: int) -> datetime:
    """Turn a series label into a timestamp.

    Handles "+30 min" offsets and "HH:MM" local clock labels, and falls back to
    hourly spacing, which matches the Open-Meteo series the API returns.
    """
    if label:
        if label.startswith("+") and label.endswith(" min"):
            try:
                return generated_at + timedelta(minutes=int(label[1:-4]))
            except ValueError:
                pass
        try:
            clock = datetime.strptime(label, "%H:%M").time()
            return generated_at.replace(hour=clock.hour, minute=clock.minute, second=0, microsecond=0)
        except ValueError:
            pass
    return generated_at + timedelta(hours=index)


def sync_prediction(lat: float, lon: float) -> MLSyncResponse:
    payload = predict(lat=lat, lon=lon)
    forecast = payload.get("forecast") or {}
    values = forecast.get("hourly_rainfall_mm") or []
    labels = forecast.get("hourly_labels") or []

    if not values:
        raise HTTPException(
            status_code=503,
            detail="No rainfall forecast is currently available for that location.",
        )
    if len(values) > _MAX_FORECAST_ROWS:
        raise HTTPException(status_code=502, detail="The forecast series was unexpectedly long.")

    generated_at = datetime.now(timezone.utc)
    point = WKTElement(f"POINT({lon} {lat})", srid=4326)
    source = payload.get("provenance", {}).get("method", "RainDrop forecast")

    records = []
    for index, value in enumerate(values):
        rainfall_mm = float(value)
        if rainfall_mm < 0:
            raise HTTPException(status_code=502, detail="The forecast contained a negative rainfall value.")
        records.append(Forecast(
            forecast_at=_forecast_time(labels[index] if index < len(labels) else None, generated_at, index),
            rainfall_mm=rainfall_mm,
            source=source[:100],
            location=point,
        ))

    db = SessionLocal()
    try:
        db.add_all(records)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return MLSyncResponse(
        location=GeoPoint(latitude=lat, longitude=lon),
        source=source[:100],
        imported_forecasts=len(records),
        risk_level=forecast.get("risk_level"),
    )
