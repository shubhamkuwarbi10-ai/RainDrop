from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
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


class Road(Base):
    __tablename__ = "roads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255))
    geometry: Mapped[str | None] = mapped_column(Geometry("LINESTRING", srid=4326))


class DrainageNode(Base):
    __tablename__ = "drainage_nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    node_type: Mapped[str | None] = mapped_column(String(100))
    geometry: Mapped[str | None] = mapped_column(Geometry("POINT", srid=4326))


class DrainageEdge(Base):
    __tablename__ = "drainage_edges"

    id: Mapped[int] = mapped_column(primary_key=True)
    from_node_id: Mapped[int] = mapped_column(ForeignKey("drainage_nodes.id"), nullable=False)
    to_node_id: Mapped[int] = mapped_column(ForeignKey("drainage_nodes.id"), nullable=False)
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