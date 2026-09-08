import asyncio
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import (
    ML_API_URL,
    NOWCAST_CATCHMENT_AREA_M2,
    NOWCAST_DRAINAGE_CAPACITY_LPS,
    NOWCAST_IMPERVIOUS_FRACTION,
    NOWCAST_INTERVAL_SECONDS,
    NOWCAST_LATITUDE,
    NOWCAST_LONGITUDE,
)
from app.db.session import SessionLocal
from app.schemas.common import NowcastIngestRequest
from app.services.nowcast_ingestion import ingest_nowcast


def _configured() -> bool:
    return (
        NOWCAST_INTERVAL_SECONDS > 0
        and -90 <= NOWCAST_LATITUDE <= 90
        and -180 <= NOWCAST_LONGITUDE <= 180
        and NOWCAST_CATCHMENT_AREA_M2 > 0
        and 0 <= NOWCAST_IMPERVIOUS_FRACTION <= 1
        and NOWCAST_DRAINAGE_CAPACITY_LPS >= 0
    )


def run_prediction_cycle() -> dict:
    query = urlencode({"lat": NOWCAST_LATITUDE, "lon": NOWCAST_LONGITUDE})
    request = Request(f"{ML_API_URL.rstrip('/')}/api/predict?{query}", headers={"Accept": "application/json"})
    with urlopen(request, timeout=15) as response:
        model_output = json.loads(response.read().decode("utf-8"))
    payload = NowcastIngestRequest(
        model_output=model_output,
        catchment_area_m2=NOWCAST_CATCHMENT_AREA_M2,
        impervious_fraction=NOWCAST_IMPERVIOUS_FRACTION,
        drainage_capacity_lps=NOWCAST_DRAINAGE_CAPACITY_LPS,
    )
    db = SessionLocal()
    try:
        return ingest_nowcast(payload, db)
    finally:
        db.close()


async def prediction_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(run_prediction_cycle)
        except Exception:
            pass
        await asyncio.sleep(NOWCAST_INTERVAL_SECONDS)


def scheduler_enabled() -> bool:
    return _configured()