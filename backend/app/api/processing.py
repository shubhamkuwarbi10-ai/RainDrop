from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from geoalchemy2.elements import WKTElement

from app.models.tables import FloodPrediction, TerrainDataset
from app.schemas.common import (
    FloodEstimateCreate,
    FloodEstimateResponse,
    GeoPoint,
    RunoffEstimateCreate,
    RunoffEstimateResponse,
    TerrainProcessResponse,
)
from app.services.terrain_processing import analyze_dem, classify_flood_risk, estimate_runoff


router = APIRouter(prefix="/api/v1/processing", tags=["phase-2-processing"])


@router.post("/terrain/{dataset_id}", response_model=TerrainProcessResponse)
def process_terrain(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.scalar(select(TerrainDataset).where(TerrainDataset.id == dataset_id))
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Terrain dataset not found")
    if dataset.dataset_type != "dem":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dataset must be a DEM")
    if not dataset.file_path:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="DEM dataset has no file_path")
    try:
        result = analyze_dem(dataset.file_path)
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    for key, value in result.items():
        setattr(dataset, key, value)
    db.commit()
    db.refresh(dataset)
    return TerrainProcessResponse(dataset_id=dataset.id, dataset_type=dataset.dataset_type, **result)


@router.post("/runoff", response_model=RunoffEstimateResponse)
def calculate_runoff(payload: RunoffEstimateCreate):
    return estimate_runoff(**payload.model_dump())


@router.post("/flood-estimate", response_model=FloodEstimateResponse, status_code=status.HTTP_201_CREATED)
def create_flood_estimate(payload: FloodEstimateCreate, db: Session = Depends(get_db)):
    runoff = estimate_runoff(
        rainfall_mm=payload.rainfall_mm,
        duration_minutes=payload.duration_minutes,
        catchment_area_m2=payload.catchment_area_m2,
        impervious_fraction=payload.impervious_fraction,
        runoff_coefficient=payload.runoff_coefficient,
    )
    capacity_volume = payload.drainage_capacity_lps * payload.duration_minutes * 60 / 1000
    excess_volume = max(0.0, runoff["runoff_volume_m3"] - capacity_volume)
    water_depth_cm = excess_volume / payload.catchment_area_m2 * 100
    risk_level = classify_flood_risk(water_depth_cm)
    record = FloodPrediction(
        predicted_at=payload.predicted_at,
        valid_until=payload.valid_until,
        road_id=payload.road_id,
        risk_level=risk_level,
        water_depth_cm=water_depth_cm,
        geometry=WKTElement(
            f"POINT({payload.location.longitude} {payload.location.latitude})", srid=4326
        ),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return FloodEstimateResponse(
        prediction_id=record.id,
        predicted_at=record.predicted_at,
        valid_until=record.valid_until,
        location=GeoPoint(latitude=payload.location.latitude, longitude=payload.location.longitude),
        road_id=record.road_id,
        runoff_volume_m3=runoff["runoff_volume_m3"],
        drainage_capacity_lps=payload.drainage_capacity_lps,
        excess_volume_m3=excess_volume,
        water_depth_cm=water_depth_cm,
        risk_level=risk_level,
    )