from datetime import datetime, timedelta, timezone

from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.models.tables import Alert, FloodPrediction, Forecast
from app.schemas.common import NowcastIngestRequest
from app.services.terrain_processing import classify_flood_risk, estimate_runoff


RISK_ORDER = {"low": 0, "moderate": 1, "high": 2, "critical": 3}


def _forecast_time(label: str | None, generated_at: datetime, index: int) -> datetime:
    if label and label.startswith("+") and label.endswith(" min"):
        try:
            return generated_at + timedelta(minutes=int(label[1:-4]))
        except ValueError:
            pass
    return generated_at + timedelta(minutes=index * 15)


def ingest_nowcast(payload: NowcastIngestRequest, db: Session) -> dict:
    model = payload.model_output
    location = model.location
    generated_at = datetime.now(timezone.utc)
    point = WKTElement(f"POINT({location.longitude} {location.latitude})", srid=4326)
    forecasts: list[Forecast] = []
    predictions: list[FloodPrediction] = []
    alerts: list[Alert] = []

    for index, rainfall_mm in enumerate(model.forecast.timeseries_mm_hr, start=1):
        label = model.forecast.timeseries_labels[index - 1] if index <= len(model.forecast.timeseries_labels) else None
        forecast_at = _forecast_time(label, generated_at, index)
        forecasts.append(Forecast(
            forecast_at=forecast_at,
            rainfall_mm=rainfall_mm,
            source=model.source,
            location=point,
        ))
        runoff = estimate_runoff(
            rainfall_mm=rainfall_mm,
            duration_minutes=payload.duration_minutes,
            catchment_area_m2=payload.catchment_area_m2,
            impervious_fraction=payload.impervious_fraction,
        )
        drainage_volume = payload.drainage_capacity_lps * payload.duration_minutes * 60 / 1000
        excess_volume = max(0.0, runoff["runoff_volume_m3"] - drainage_volume)
        depth_cm = excess_volume / payload.catchment_area_m2 * 100
        risk = classify_flood_risk(depth_cm)
        predictions.append(FloodPrediction(
            predicted_at=forecast_at,
            valid_until=forecast_at + timedelta(minutes=payload.duration_minutes),
            risk_level=risk,
            water_depth_cm=depth_cm,
            road_id=payload.road_id,
            geometry=point,
        ))
        if risk in {"high", "critical"}:
            alerts.append(Alert(
                severity=risk,
                message=f"{risk.title()} flood risk predicted: {depth_cm:.1f} cm water depth.",
                created_at=generated_at,
                expires_at=forecast_at + timedelta(minutes=payload.duration_minutes),
                geometry=point,
            ))

    db.add_all(forecasts + predictions + alerts)
    db.commit()
    highest = max((prediction.risk_level for prediction in predictions), key=RISK_ORDER.get, default="low")
    return {
        "location": {"latitude": location.latitude, "longitude": location.longitude},
        "source": model.source,
        "imported_forecasts": len(forecasts),
        "generated_predictions": len(predictions),
        "generated_alerts": len(alerts),
        "max_water_depth_cm": max((prediction.water_depth_cm for prediction in predictions), default=0),
        "highest_risk_level": highest,
    }