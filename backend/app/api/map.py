import json
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import Alert, DrainageEdge, DrainageNode, FloodPrediction, Forecast, Rainfall, Road


router = APIRouter(prefix="/api/v1/map", tags=["map"])


@router.get("/flood", summary="Flood predictions as GeoJSON")
def flood_layer(
    since: datetime | None = Query(default=None),
    min_depth_cm: float = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = select(
        FloodPrediction,
        func.ST_AsGeoJSON(FloodPrediction.geometry),
    ).where(FloodPrediction.water_depth_cm >= min_depth_cm)
    if since:
        query = query.where(FloodPrediction.predicted_at >= since)
    rows = db.execute(query.order_by(FloodPrediction.predicted_at.desc())).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": None if geometry is None else json.loads(geometry),
                "properties": {
                    "id": record.id,
                    "road_id": record.road_id,
                    "risk_level": record.risk_level,
                    "water_depth_cm": record.water_depth_cm,
                    "predicted_at": record.predicted_at.isoformat(),
                    "valid_until": record.valid_until.isoformat() if record.valid_until else None,
                },
            }
            for record, geometry in rows
        ],
    }


@router.get("/rainfall", summary="Observed rainfall as GeoJSON")
def rainfall_layer(limit: int = Query(default=1000, ge=1, le=5000), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Rainfall, func.ST_AsGeoJSON(Rainfall.location))
        .order_by(Rainfall.observed_at.desc())
        .limit(limit)
    ).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": None if geometry is None else json.loads(geometry),
                "properties": {"id": record.id, "amount_mm": record.amount_mm, "observed_at": record.observed_at.isoformat()},
            }
            for record, geometry in rows
        ],
    }


@router.get("/forecasts", summary="Forecast rainfall as GeoJSON")
def forecast_layer(limit: int = Query(default=1000, ge=1, le=5000), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Forecast, func.ST_AsGeoJSON(Forecast.location))
        .order_by(Forecast.forecast_at.asc())
        .limit(limit)
    ).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": None if geometry is None else json.loads(geometry),
                "properties": {
                    "id": record.id,
                    "rainfall_mm": record.rainfall_mm,
                    "source": record.source,
                    "confidence": record.confidence,
                    "forecast_at": record.forecast_at.isoformat(),
                },
            }
            for record, geometry in rows
        ],
    }


@router.get("/roads", summary="Roads as GeoJSON")
def road_layer(db: Session = Depends(get_db)):
    rows = db.execute(select(Road, func.ST_AsGeoJSON(Road.geometry))).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": None if geometry is None else json.loads(geometry),
             "properties": {"id": record.id, "name": record.name, "road_class": record.road_class}}
            for record, geometry in rows
        ],
    }


@router.get("/drainage", summary="Drainage network as GeoJSON")
def drainage_layer(db: Session = Depends(get_db)):
    node_rows = db.execute(select(DrainageNode, func.ST_AsGeoJSON(DrainageNode.geometry))).all()
    edge_rows = db.execute(select(DrainageEdge, func.ST_AsGeoJSON(DrainageEdge.geometry))).all()
    return {
        "nodes": {"type": "FeatureCollection", "features": [
            {"type": "Feature", "geometry": None if geometry is None else json.loads(geometry),
             "properties": {"id": record.id, "node_type": record.node_type, "elevation_m": record.elevation_m,
                            "inlet_capacity_lps": record.inlet_capacity_lps}}
            for record, geometry in node_rows
        ]},
        "edges": {"type": "FeatureCollection", "features": [
            {"type": "Feature", "geometry": None if geometry is None else json.loads(geometry),
             "properties": {"id": record.id, "from_node_id": record.from_node_id, "to_node_id": record.to_node_id,
                            "capacity_lps": record.capacity_lps}}
            for record, geometry in edge_rows
        ]},
    }


@router.get("/alerts", summary="Active alerts as GeoJSON")
def alert_layer(db: Session = Depends(get_db)):
    now = datetime.now().astimezone()
    rows = db.execute(
        select(Alert, func.ST_AsGeoJSON(Alert.geometry))
        .where((Alert.expires_at.is_(None)) | (Alert.expires_at >= now))
        .order_by(Alert.created_at.desc())
    ).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": None if geometry is None else json.loads(geometry),
             "properties": {"id": record.id, "severity": record.severity, "message": record.message,
                            "created_at": record.created_at.isoformat(),
                            "expires_at": record.expires_at.isoformat() if record.expires_at else None}}
            for record, geometry in rows
        ],
    }


@router.get("/routes/safe", summary="Return road segments currently below flood threshold")
def safe_route_layer(
    max_depth_cm: float = Query(default=15, ge=0),
    db: Session = Depends(get_db),
):
    blocked = select(FloodPrediction.road_id).where(
        FloodPrediction.road_id.is_not(None), FloodPrediction.water_depth_cm > max_depth_cm
    ).distinct()
    rows = db.execute(
        select(Road, func.ST_AsGeoJSON(Road.geometry))
        .where(~Road.id.in_(blocked))
    ).all()
    return {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "geometry": None if geometry is None else json.loads(geometry),
             "properties": {"id": record.id, "name": record.name, "road_class": record.road_class,
                            "safe_below_depth_cm": max_depth_cm}}
            for record, geometry in rows
        ],
        "blocked_depth_threshold_cm": max_depth_cm,
        "note": "This is a safe road-segment layer. Turn-by-turn routing requires a road graph or OSRM integration.",
    }