from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import NowcastIngestRequest, NowcastIngestResponse
from app.services.nowcast_ingestion import ingest_nowcast


router = APIRouter(prefix="/api/v1/nowcast", tags=["nowcast"])


@router.post("/ingest", response_model=NowcastIngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_model_nowcast(payload: NowcastIngestRequest, db: Session = Depends(get_db)):
    return ingest_nowcast(payload, db)