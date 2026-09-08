from fastapi import APIRouter, Depends, Query, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import Alert, FloodPrediction
from app.schemas.common import (
    AlertCreate,
    AlertResponse,
    FloodPredictionCreate,
    FloodPredictionResponse,
)


router = APIRouter(prefix="/api/v1", tags=["flooding"])


def _point_wkt(latitude: float, longitude: float) -> WKTElement:
    return WKTElement(f"POINT({longitude} {latitude})", srid=4326)


@router.post(
    "/flood-predictions",
    response_model=FloodPredictionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_flood_prediction(
    payload: FloodPredictionCreate,
    db: Session = Depends(get_db),
):
    geometry = None
    if payload.location:
        geometry = _point_wkt(payload.location.latitude, payload.location.longitude)
    record = FloodPrediction(
        predicted_at=payload.predicted_at,
        water_depth_cm=payload.water_depth_cm,
        risk_level=payload.risk_level,
        valid_until=payload.valid_until,
        road_id=payload.road_id,
        geometry=geometry,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return FloodPredictionResponse(id=record.id, **payload.model_dump())


@router.get("/flood-predictions", response_model=list[FloodPredictionResponse])
def list_flood_predictions(
    risk_level: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    query = select(FloodPrediction).order_by(FloodPrediction.predicted_at.desc()).limit(limit)
    if risk_level:
        query = query.where(FloodPrediction.risk_level == risk_level)
    records = db.scalars(query).all()
    return [
        FloodPredictionResponse(
            id=record.id,
            predicted_at=record.predicted_at,
            water_depth_cm=record.water_depth_cm,
            risk_level=record.risk_level,
            valid_until=record.valid_until,
            road_id=record.road_id,
            location=None,
        )
        for record in records
    ]


@router.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    geometry = None
    if payload.location:
        geometry = _point_wkt(payload.location.latitude, payload.location.longitude)
    record = Alert(
        severity=payload.severity,
        message=payload.message,
        created_at=payload.created_at,
        expires_at=payload.expires_at,
        geometry=geometry,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AlertResponse(id=record.id, **payload.model_dump())


@router.get("/alerts", response_model=list[AlertResponse])
def list_alerts(
    severity: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    query = select(Alert).order_by(Alert.created_at.desc()).limit(limit)
    if severity:
        query = query.where(Alert.severity == severity)
    records = db.scalars(query).all()
    return [
        AlertResponse(
            id=record.id,
            severity=record.severity,
            message=record.message,
            created_at=record.created_at,
            expires_at=record.expires_at,
            location=None,
        )
        for record in records
    ]