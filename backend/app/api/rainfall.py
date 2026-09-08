from fastapi import APIRouter, Depends, Query, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import Forecast, Rainfall
from app.services.ml_client import sync_prediction
from app.schemas.common import (
    ForecastCreate,
    ForecastResponse,
    GeoPoint,
    MLSyncResponse,
    RainfallCreate,
    RainfallResponse,
)


router = APIRouter(prefix="/api/v1", tags=["rainfall"])


def _point_wkt(latitude: float, longitude: float) -> WKTElement:
    return WKTElement(f"POINT({longitude} {latitude})", srid=4326)


@router.post("/rainfall", response_model=RainfallResponse, status_code=status.HTTP_201_CREATED)
def create_rainfall(payload: RainfallCreate, db: Session = Depends(get_db)):
    record = Rainfall(
        observed_at=payload.observed_at,
        amount_mm=payload.amount_mm,
        location=_point_wkt(payload.location.latitude, payload.location.longitude),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return RainfallResponse(
        id=record.id,
        observed_at=record.observed_at,
        amount_mm=record.amount_mm,
        location=payload.location,
    )


@router.get("/rainfall", response_model=list[RainfallResponse])
def list_rainfall(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    records = db.execute(
        select(
            Rainfall,
            func.ST_Y(Rainfall.location).label("latitude"),
            func.ST_X(Rainfall.location).label("longitude"),
        )
        .order_by(Rainfall.observed_at.desc())
        .limit(limit)
    ).all()
    return [
        RainfallResponse(
            id=record.id,
            observed_at=record.observed_at,
            amount_mm=record.amount_mm,
            location=(
                GeoPoint(latitude=latitude, longitude=longitude)
                if latitude is not None and longitude is not None
                else None
            ),
        )
        for record, latitude, longitude in records
    ]


@router.post("/forecasts", response_model=ForecastResponse, status_code=status.HTTP_201_CREATED)
def create_forecast(payload: ForecastCreate, db: Session = Depends(get_db)):
    record = Forecast(
        forecast_at=payload.forecast_at,
        rainfall_mm=payload.rainfall_mm,
        source=payload.source,
        confidence=payload.confidence,
        location=_point_wkt(payload.location.latitude, payload.location.longitude),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ForecastResponse(id=record.id, **payload.model_dump())


@router.get("/forecasts", response_model=list[ForecastResponse])
def list_forecasts(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    records = db.execute(
        select(
            Forecast,
            func.ST_Y(Forecast.location).label("latitude"),
            func.ST_X(Forecast.location).label("longitude"),
        )
        .order_by(Forecast.forecast_at.desc())
        .limit(limit)
    ).all()
    return [
        ForecastResponse(
            id=record.id,
            forecast_at=record.forecast_at,
            rainfall_mm=record.rainfall_mm,
            source=record.source,
            confidence=record.confidence,
            location=(
                GeoPoint(latitude=latitude, longitude=longitude)
                if latitude is not None and longitude is not None
                else None
            ),
        )
        for record, latitude, longitude in records
    ]


@router.post("/forecasts/sync", response_model=MLSyncResponse)
def sync_ml_forecast(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    return sync_prediction(lat, lon)