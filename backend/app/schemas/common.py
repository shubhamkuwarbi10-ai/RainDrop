from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


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


class ModelLocation(BaseModel):
    latitude: float = Field(alias="lat", ge=-90, le=90)
    longitude: float = Field(alias="lon", ge=-180, le=180)
    model_config = ConfigDict(populate_by_name=True)


class NowcastForecast(BaseModel):
    timeseries_mm_hr: list[float] = Field(min_length=1)
    timeseries_labels: list[str] = Field(default_factory=list)
    risk_level: str | None = None

    @model_validator(mode="after")
    def validate_rainfall(self):
        if any(value < 0 for value in self.timeseries_mm_hr):
            raise ValueError("Nowcast rainfall values cannot be negative")
        return self


class NowcastModelPayload(BaseModel):
    location: ModelLocation
    source: str = Field(default="RainDrop ML", max_length=100)
    forecast: NowcastForecast


class NowcastIngestRequest(BaseModel):
    model_output: NowcastModelPayload
    catchment_area_m2: float = Field(gt=0)
    impervious_fraction: float = Field(ge=0, le=1)
    drainage_capacity_lps: float = Field(ge=0)
    duration_minutes: float = Field(default=15, gt=0, le=180)
    road_id: int | None = Field(default=None, ge=1)


class NowcastIngestResponse(BaseModel):
    location: GeoPoint
    source: str
    imported_forecasts: int
    generated_predictions: int
    generated_alerts: int
    max_water_depth_cm: float
    highest_risk_level: Literal["low", "moderate", "high", "critical"]


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


class BoundingBox(BaseModel):
    min_latitude: float = Field(ge=-90, le=90)
    min_longitude: float = Field(ge=-180, le=180)
    max_latitude: float = Field(ge=-90, le=90)
    max_longitude: float = Field(ge=-180, le=180)

    @model_validator(mode="after")
    def validate_order(self):
        if self.min_latitude >= self.max_latitude or self.min_longitude >= self.max_longitude:
            raise ValueError("Bounding box minimum values must be lower than maximum values")
        return self


class RadarRainfallGridCreate(BaseModel):
    captured_at: datetime
    source: str = Field(min_length=1, max_length=100)
    resolution_m: float = Field(gt=0)
    bounds: BoundingBox
    values: list[list[float]] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_values(self):
        if any(not row for row in self.values) or any(value < 0 for row in self.values for value in row):
            raise ValueError("Radar grid rows cannot be empty and values cannot be negative")
        return self


class RadarRainfallGridResponse(RadarRainfallGridCreate):
    id: int


class TerrainDatasetCreate(BaseModel):
    dataset_type: Literal["dem", "imperviousness"]
    name: str = Field(min_length=1, max_length=255)
    source: str | None = Field(default=None, max_length=255)
    resolution_m: float | None = Field(default=None, gt=0)
    min_value: float | None = None
    max_value: float | None = None
    file_path: str | None = Field(default=None, max_length=500)


class TerrainDatasetResponse(TerrainDatasetCreate):
    id: int
    min_slope: float | None = None
    max_slope: float | None = None
    crs: str | None = None
    processed_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class TerrainProcessResponse(BaseModel):
    dataset_id: int
    dataset_type: Literal["dem", "imperviousness"]
    min_value: float
    max_value: float
    min_slope: float
    max_slope: float
    crs: str | None = None
    processed_at: datetime


class RunoffEstimateCreate(BaseModel):
    rainfall_mm: float = Field(ge=0)
    duration_minutes: float = Field(gt=0, le=180)
    catchment_area_m2: float = Field(gt=0)
    impervious_fraction: float = Field(ge=0, le=1)
    runoff_coefficient: float | None = Field(default=None, ge=0, le=1)


class RunoffEstimateResponse(BaseModel):
    rainfall_mm: float
    duration_minutes: float
    catchment_area_m2: float
    runoff_coefficient: float
    runoff_volume_m3: float
    average_runoff_lps: float


class FloodEstimateCreate(RunoffEstimateCreate):
    predicted_at: datetime
    valid_until: datetime | None = None
    location: GeoPoint
    road_id: int | None = Field(default=None, ge=1)
    drainage_capacity_lps: float = Field(ge=0)


class FloodEstimateResponse(BaseModel):
    prediction_id: int
    predicted_at: datetime
    valid_until: datetime | None = None
    location: GeoPoint
    road_id: int | None = None
    runoff_volume_m3: float
    drainage_capacity_lps: float
    excess_volume_m3: float
    water_depth_cm: float
    risk_level: Literal["low", "moderate", "high", "critical"]


class RoadCreate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    road_class: str | None = Field(default=None, max_length=100)
    coordinates: list[GeoPoint] = Field(min_length=2)


class RoadResponse(BaseModel):
    id: int
    name: str | None = None
    road_class: str | None = None


class DrainageNodeCreate(BaseModel):
    node_type: str | None = Field(default=None, max_length=100)
    elevation_m: float | None = None
    inlet_capacity_lps: float | None = Field(default=None, ge=0)
    location: GeoPoint


class DrainageNodeResponse(BaseModel):
    id: int
    node_type: str | None = None
    elevation_m: float | None = None
    inlet_capacity_lps: float | None = None
    location: GeoPoint


class DrainageEdgeCreate(BaseModel):
    from_node_id: int = Field(ge=1)
    to_node_id: int = Field(ge=1)
    length_m: float | None = Field(default=None, gt=0)
    diameter_mm: float | None = Field(default=None, gt=0)
    slope: float | None = None
    capacity_lps: float | None = Field(default=None, ge=0)
    coordinates: list[GeoPoint] = Field(min_length=2)


class DrainageEdgeResponse(BaseModel):
    id: int
    from_node_id: int
    to_node_id: int
    length_m: float | None = None
    diameter_mm: float | None = None
    slope: float | None = None
    capacity_lps: float | None = None


class DrainageSolveRequest(BaseModel):
    rainfall_runoff_lps: float = Field(ge=0)
    blockage_factor: float = Field(default=0, ge=0, le=0.95)
    roughness: float = Field(default=0.013, gt=0)


class DrainageEdgeAnalysis(BaseModel):
    edge_id: int
    from_node_id: int
    to_node_id: int
    capacity_lps: float
    effective_capacity_lps: float
    allocated_flow_lps: float
    utilization: float
    overloaded: bool


class DrainageSolveResponse(BaseModel):
    rainfall_runoff_lps: float
    total_capacity_lps: float
    total_effective_capacity_lps: float
    total_allocated_flow_lps: float
    overloaded_edges: int
    network_overloaded: bool
    edges: list[DrainageEdgeAnalysis]


class CalibrationRequest(BaseModel):
    observed_depths_cm: list[float] = Field(min_length=1)
    predicted_depths_cm: list[float] = Field(min_length=1)

    @model_validator(mode="after")
    def matching_samples(self):
        if len(self.observed_depths_cm) != len(self.predicted_depths_cm):
            raise ValueError("Observed and predicted samples must have equal length")
        if any(value < 0 for value in self.observed_depths_cm + self.predicted_depths_cm):
            raise ValueError("Depth values cannot be negative")
        return self


class CalibrationResponse(BaseModel):
    sample_count: int
    mae_cm: float
    rmse_cm: float
    bias_cm: float
    max_absolute_error_cm: float


class DatasetImportResponse(BaseModel):
    dataset_type: Literal["roads", "drainage_nodes", "drainage_edges", "dem", "imperviousness"]
    imported_count: int
    skipped_count: int = 0
    message: str