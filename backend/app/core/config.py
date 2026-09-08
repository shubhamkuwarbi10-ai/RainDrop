import os

from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/raindrop",
)
ML_API_URL = os.getenv("ML_API_URL", "http://127.0.0.1:8000")
NOWCAST_INTERVAL_SECONDS = int(os.getenv("NOWCAST_INTERVAL_SECONDS", "0"))
NOWCAST_LATITUDE = float(os.getenv("NOWCAST_LATITUDE", "0"))
NOWCAST_LONGITUDE = float(os.getenv("NOWCAST_LONGITUDE", "0"))
NOWCAST_CATCHMENT_AREA_M2 = float(os.getenv("NOWCAST_CATCHMENT_AREA_M2", "0"))
NOWCAST_IMPERVIOUS_FRACTION = float(os.getenv("NOWCAST_IMPERVIOUS_FRACTION", "0"))
NOWCAST_DRAINAGE_CAPACITY_LPS = float(os.getenv("NOWCAST_DRAINAGE_CAPACITY_LPS", "0"))