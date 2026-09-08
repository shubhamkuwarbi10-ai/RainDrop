from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import DATABASE_URL
from app.db.base import Base
from app.models import tables  # noqa: F401


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def initialize_database() -> None:
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE forecast ADD COLUMN IF NOT EXISTS source VARCHAR(100)"))
        connection.execute(text("ALTER TABLE forecast ADD COLUMN IF NOT EXISTS confidence FLOAT"))
        connection.execute(text("ALTER TABLE flood_predictions ADD COLUMN IF NOT EXISTS water_depth_cm FLOAT NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE flood_predictions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE"))
        connection.execute(text("ALTER TABLE flood_predictions ADD COLUMN IF NOT EXISTS road_id INTEGER REFERENCES roads(id)"))
        connection.execute(text(
            "ALTER TABLE flood_predictions "
            "ALTER COLUMN geometry TYPE geometry(POINT, 4326) "
            "USING CASE WHEN GeometryType(geometry) IN ('POLYGON', 'MULTIPOLYGON') "
            "THEN ST_Centroid(geometry) ELSE geometry END"
        ))
        connection.execute(text("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE"))
        connection.execute(text("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS geometry geometry(POINT, 4326)"))