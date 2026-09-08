import json
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from app.core.config import ML_API_URL
from app.db.session import SessionLocal
from app.models.tables import Forecast
from app.schemas.common import GeoPoint, MLSyncResponse
from geoalchemy2.elements import WKTElement


def _forecast_time(label: str | None, generated_at: datetime, index: int) -> datetime:
    if label and label.startswith("+") and label.endswith(" min"):
        try:
            minutes = int(label[1:-4])
            return generated_at + timedelta(minutes=minutes)
        except ValueError:
            pass
    if label:
        try:
            clock_time = datetime.strptime(label, "%H:%M").time()
            return generated_at.replace(
                hour=clock_time.hour,
                minute=clock_time.minute,
                second=0,
                microsecond=0,
            )
        except ValueError:
            pass
    return generated_at + timedelta(minutes=index * 15)


def sync_prediction(lat: float, lon: float) -> MLSyncResponse:
    query = urlencode({"lat": lat, "lon": lon})
    request = Request(
        f"{ML_API_URL.rstrip('/')}/api/predict?{query}",
        headers={"Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"ML service unavailable: {exc}") from exc

    forecast = payload.get("forecast") or {}
    values = forecast.get("timeseries_mm_hr") or []
    labels = forecast.get("timeseries_labels") or []
    if not isinstance(values, list):
        raise HTTPException(status_code=502, detail="ML service returned an invalid forecast series")

    generated_at = datetime.now(timezone.utc)
    records = []
    for index, value in enumerate(values, start=1):
        try:
            rainfall_rate = float(value)
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=502, detail="ML service returned a non-numeric forecast value") from exc
        if rainfall_rate < 0:
            raise HTTPException(status_code=502, detail="ML service returned negative rainfall")
        records.append(
            Forecast(
                forecast_at=_forecast_time(labels[index - 1] if index <= len(labels) else None, generated_at, index),
                rainfall_mm=rainfall_rate,
                source=payload.get("source", "RainDrop ML"),
                location=WKTElement(f"POINT({lon} {lat})", srid=4326),
            )
        )

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
        source=payload.get("source", "RainDrop ML"),
        imported_forecasts=len(records),
        risk_level=forecast.get("risk_level"),
    )