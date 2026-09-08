from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Rainfall(Base):
    __tablename__ = "rainfall"

    id: Mapped[int] = mapped_column(primary_key=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount_mm: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))


class Forecast(Base):
    __tablename__ = "forecast"

    id: Mapped[int] = mapped_column(primary_key=True)
    forecast_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rainfall_mm: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))
    source: Mapped[str | None] = mapped_column(String(100))
    confidence: Mapped[float | None] = mapped_column(Float)


class RadarRainfallGrid(Base):
    __tablename__ = "radar_rainfall_grids"

    id: Mapped[int] = mapped_column(primary_key=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    resolution_m: Mapped[float] = mapped_column(Float, nullable=False)
    min_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    min_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    max_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    max_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    values: Mapped[list[list[float]]] = mapped_column(JSON, nullable=False)


class TerrainDataset(Base):
    __tablename__ = "terrain_datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_type: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str | None] = mapped_column(String(255))
    resolution_m: Mapped[float | None] = mapped_column(Float)
    min_value: Mapped[float | None] = mapped_column(Float)
    max_value: Mapped[float | None] = mapped_column(Float)
    min_slope: Mapped[float | None] = mapped_column(Float)
    max_slope: Mapped[float | None] = mapped_column(Float)
    crs: Mapped[str | None] = mapped_column(String(100))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    file_path: Mapped[str | None] = mapped_column(String(500))


class Road(Base):
    __tablename__ = "roads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255))
    road_class: Mapped[str | None] = mapped_column(String(100))
    geometry: Mapped[str | None] = mapped_column(Geometry("LINESTRING", srid=4326))


class DrainageNode(Base):
    __tablename__ = "drainage_nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    node_type: Mapped[str | None] = mapped_column(String(100))
    elevation_m: Mapped[float | None] = mapped_column(Float)
    inlet_capacity_lps: Mapped[float | None] = mapped_column(Float)
    geometry: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))


class DrainageEdge(Base):
    __tablename__ = "drainage_edges"

    id: Mapped[int] = mapped_column(primary_key=True)
    from_node_id: Mapped[int] = mapped_column(ForeignKey("drainage_nodes.id"), nullable=False)
    to_node_id: Mapped[int] = mapped_column(ForeignKey("drainage_nodes.id"), nullable=False)
    length_m: Mapped[float | None] = mapped_column(Float)
    diameter_mm: Mapped[float | None] = mapped_column(Float)
    slope: Mapped[float | None] = mapped_column(Float)
    capacity_lps: Mapped[float | None] = mapped_column(Float)
    geometry: Mapped[str | None] = mapped_column(Geometry("LINESTRING", srid=4326))


class FloodPrediction(Base):
    __tablename__ = "flood_predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False)
    water_depth_cm: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    road_id: Mapped[int | None] = mapped_column(ForeignKey("roads.id"))
    geometry: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    geometry: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))