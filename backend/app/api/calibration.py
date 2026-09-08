from fastapi import APIRouter

from app.schemas.common import CalibrationRequest, CalibrationResponse
from app.services.calibration import calculate_calibration_metrics


router = APIRouter(prefix="/api/v1/calibration", tags=["calibration"])


@router.post("/depth", response_model=CalibrationResponse)
def calibrate_depth(payload: CalibrationRequest):
    return calculate_calibration_metrics(payload.observed_depths_cm, payload.predicted_depths_cm)