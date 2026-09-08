from fastapi import APIRouter, Depends, Query, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import DrainageEdge, DrainageNode, RadarRainfallGrid, Road, TerrainDataset
from app.schemas.common import (
    DrainageEdgeCreate, DrainageEdgeResponse, DrainageNodeCreate, DrainageNodeResponse,
    GeoPoint, RadarRainfallGridCreate, RadarRainfallGridResponse, RoadCreate, RoadResponse,
    TerrainDatasetCreate, TerrainDatasetResponse,
)

router = APIRouter(prefix="/api/v1/ingestion", tags=["phase-1-ingestion"])


def _point_wkt(point: GeoPoint) -> WKTElement:
    return WKTElement(f"POINT({point.longitude} {point.latitude})", srid=4326)


def _line_wkt(points: list[GeoPoint]) -> WKTElement:
    coordinates = ", ".join(f"{point.longitude} {point.latitude}" for point in points)
    return WKTElement(f"LINESTRING({coordinates})", srid=4326)


@router.post("/radar-rainfall", response_model=RadarRainfallGridResponse, status_code=status.HTTP_201_CREATED)
def ingest_radar_rainfall(payload: RadarRainfallGridCreate, db: Session = Depends(get_db)):
    record = RadarRainfallGrid(
        captured_at=payload.captured_at, source=payload.source, resolution_m=payload.resolution_m,
        min_latitude=payload.bounds.min_latitude, min_longitude=payload.bounds.min_longitude,
        max_latitude=payload.bounds.max_latitude, max_longitude=payload.bounds.max_longitude,
        values=payload.values,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return RadarRainfallGridResponse(id=record.id, **payload.model_dump())


@router.get("/radar-rainfall", response_model=list[RadarRainfallGridResponse])
def list_radar_rainfall(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    records = db.scalars(select(RadarRainfallGrid).order_by(RadarRainfallGrid.captured_at.desc()).limit(limit)).all()
    return [RadarRainfallGridResponse(
        id=record.id, captured_at=record.captured_at, source=record.source, resolution_m=record.resolution_m,
        bounds={"min_latitude": record.min_latitude, "min_longitude": record.min_longitude,
                "max_latitude": record.max_latitude, "max_longitude": record.max_longitude}, values=record.values,
    ) for record in records]


@router.post("/terrain", response_model=TerrainDatasetResponse, status_code=status.HTTP_201_CREATED)
def register_terrain_dataset(payload: TerrainDatasetCreate, db: Session = Depends(get_db)):
    record = TerrainDataset(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return TerrainDatasetResponse(id=record.id, **payload.model_dump())


@router.get("/terrain", response_model=list[TerrainDatasetResponse])
def list_terrain_datasets(db: Session = Depends(get_db)):
    return db.scalars(select(TerrainDataset).order_by(TerrainDataset.id.desc())).all()


@router.post("/roads", response_model=RoadResponse, status_code=status.HTTP_201_CREATED)
def ingest_road(payload: RoadCreate, db: Session = Depends(get_db)):
    record = Road(name=payload.name, road_class=payload.road_class, geometry=_line_wkt(payload.coordinates))
    db.add(record)
    db.commit()
    db.refresh(record)
    return RoadResponse(id=record.id, name=record.name, road_class=record.road_class)


@router.post("/drainage-nodes", response_model=DrainageNodeResponse, status_code=status.HTTP_201_CREATED)
def ingest_drainage_node(payload: DrainageNodeCreate, db: Session = Depends(get_db)):
    record = DrainageNode(node_type=payload.node_type, elevation_m=payload.elevation_m,
                          inlet_capacity_lps=payload.inlet_capacity_lps, geometry=_point_wkt(payload.location))
    db.add(record)
    db.commit()
    db.refresh(record)
    return DrainageNodeResponse(id=record.id, **payload.model_dump())


@router.post("/drainage-edges", response_model=DrainageEdgeResponse, status_code=status.HTTP_201_CREATED)
def ingest_drainage_edge(payload: DrainageEdgeCreate, db: Session = Depends(get_db)):
    record = DrainageEdge(
        from_node_id=payload.from_node_id, to_node_id=payload.to_node_id, length_m=payload.length_m,
        diameter_mm=payload.diameter_mm, slope=payload.slope, capacity_lps=payload.capacity_lps,
        geometry=_line_wkt(payload.coordinates),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return DrainageEdgeResponse(id=record.id, **payload.model_dump(exclude={"coordinates"}))