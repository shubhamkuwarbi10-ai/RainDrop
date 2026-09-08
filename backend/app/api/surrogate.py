from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import FloodPrediction
from app.schemas.common import SurrogatePredictionCreate, SurrogatePredictionResponse
from app.services.surrogate_prediction import predict_depth
from app.services.terrain_processing import classify_flood_risk


router = APIRouter(prefix="/api/v1/processing", tags=["real-surrogate-model"])


@router.post("/surrogate-prediction", response_model=SurrogatePredictionResponse, status_code=status.HTTP_201_CREATED)
def create_surrogate_prediction(payload: SurrogatePredictionCreate, db: Session = Depends(get_db)):
    try:
        result = predict_depth(
            city=payload.city,
            latitude=payload.location.latitude,
            longitude=payload.location.longitude,
            total_precip_mm=payload.total_precip_mm,
            peak_intensity_mm_hr=payload.peak_intensity_mm_hr,
            impermeability_pct=payload.impermeability_pct,
        )
    except (FileNotFoundError, RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    risk_level = classify_flood_risk(float(result["water_depth_cm"]))
    record = FloodPrediction(
        predicted_at=payload.predicted_at or result["predicted_at"],
        valid_until=payload.valid_until,
        risk_level=risk_level,
        water_depth_cm=float(result["water_depth_cm"]),
        road_id=payload.road_id,
        geometry=WKTElement(
            f"POINT({payload.location.longitude} {payload.location.latitude})", srid=4326
        ),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return SurrogatePredictionResponse(
        prediction_id=record.id,
        city=payload.city,
        location=payload.location,
        risk_level=risk_level,
        valid_until=record.valid_until,
        **{key: value for key, value in result.items() if key != "predicted_at"},
        predicted_at=record.predicted_at,
    )