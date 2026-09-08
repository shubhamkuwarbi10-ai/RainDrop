from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GeoPoint(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class RainfallBase(BaseModel):
    observed_at: datetime
    amount_mm: float = Field(ge=0)
    location: GeoPoint


class RainfallCreate(RainfallBase):
    pass


class RainfallResponse(RainfallBase):
    id: int
    location: GeoPoint | None = None
    model_config = ConfigDict(from_attributes=True)


class ForecastCreate(BaseModel):
    forecast_at: datetime
    rainfall_mm: float = Field(ge=0)
    location: GeoPoint
    source: str | None = Field(default=None, max_length=100)
    confidence: float | None = Field(default=None, ge=0, le=1)


class ForecastResponse(ForecastCreate):
    id: int
    location: GeoPoint | None = None
    model_config = ConfigDict(from_attributes=True)


class MLSyncResponse(BaseModel):
    location: GeoPoint
    source: str
    imported_forecasts: int
    risk_level: str | None = None


class FloodPredictionCreate(BaseModel):
    predicted_at: datetime
    water_depth_cm: float = Field(ge=0)
    risk_level: str = Field(pattern="^(low|moderate|high|critical)$")
    valid_until: datetime | None = None
    road_id: int | None = Field(default=None, ge=1)
    location: GeoPoint | None = None


class FloodPredictionResponse(FloodPredictionCreate):
    id: int


class AlertCreate(BaseModel):
    severity: str = Field(pattern="^(low|moderate|high|critical)$")
    message: str = Field(min_length=1, max_length=2000)
    created_at: datetime
    expires_at: datetime | None = None
    location: GeoPoint | None = None


class AlertResponse(AlertCreate):
    id: int