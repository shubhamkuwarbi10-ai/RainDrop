"""The depth heuristic, and the rule that a model must prove itself to be used."""
import pytest

from app.services import flood_estimate as fe


class TestCriticalDuration:
    """The point of the rewrite: intensity floods, not daily totals."""

    def test_same_total_floods_when_concentrated_and_not_when_spread(self):
        concentrated = [0, 30, 40, 30, 0, 0, 0, 0, 0, 0, 0, 0]   # 100 mm in 3 h
        spread = [100 / 12] * 12                                  # 100 mm in 12 h

        deep, _ = fe.heuristic_depth_cm(concentrated, impermeability_pct=65, slope_deg=0.75)
        shallow, _ = fe.heuristic_depth_cm(spread, impermeability_pct=65, slope_deg=0.75)

        assert deep > 20, "100 mm in 3 hours must produce substantial ponding"
        assert shallow == 0, "the same 100 mm over 12 hours drains away"

    def test_dry_weather_produces_no_flooding(self):
        depth, _ = fe.heuristic_depth_cm([0] * 12, impermeability_pct=65, slope_deg=0.75)
        assert depth == 0

    def test_rain_below_drainage_capacity_produces_no_flooding(self):
        # 10 mm/hr against a 12 mm/hr drain, with runoff coefficient < 1.
        depth, _ = fe.heuristic_depth_cm([10] * 6, impermeability_pct=65, slope_deg=0.75)
        assert depth == 0

    def test_depth_increases_monotonically_with_intensity(self):
        depths = [
            fe.heuristic_depth_cm([0, rate, rate, 0, 0, 0], impermeability_pct=65, slope_deg=0.75)[0]
            for rate in (10, 20, 40, 80)
        ]
        assert depths == sorted(depths)

    def test_the_critical_window_is_reported(self):
        _, workings = fe.heuristic_depth_cm(
            [0, 0, 60, 60, 0, 0], impermeability_pct=70, slope_deg=0.5,
        )
        assert workings["critical_window_hours"] == 2
        assert workings["critical_window_rain_mm"] == 120


class TestTerrainSensitivity:
    def test_flatter_ground_ponds_deeper(self):
        storm = [0, 40, 40, 0, 0, 0]
        flat, _ = fe.heuristic_depth_cm(storm, impermeability_pct=65, slope_deg=0.2)
        steep, _ = fe.heuristic_depth_cm(storm, impermeability_pct=65, slope_deg=4.0)
        assert flat > steep

    def test_more_paving_produces_more_runoff(self):
        storm = [0, 40, 40, 0, 0, 0]
        paved, _ = fe.heuristic_depth_cm(storm, impermeability_pct=90, slope_deg=0.75)
        green, _ = fe.heuristic_depth_cm(storm, impermeability_pct=30, slope_deg=0.75)
        assert paved > green

    def test_better_drainage_reduces_depth(self):
        storm = [0, 40, 40, 0, 0, 0]
        poor, _ = fe.heuristic_depth_cm(storm, impermeability_pct=65, slope_deg=0.75, drain_rate_mm_hr=6)
        good, _ = fe.heuristic_depth_cm(storm, impermeability_pct=65, slope_deg=0.75, drain_rate_mm_hr=25)
        assert poor > good


class TestRiskBands:
    @pytest.mark.parametrize("depth,expected", [
        (0.0, "NONE"), (3.0, "LOW"), (10.0, "MODERATE"), (20.0, "HIGH"), (45.0, "SEVERE"),
    ])
    def test_depth_bands(self, depth, expected):
        assert fe.classify_risk(depth, peak_intensity_mm_hr=0.0) == expected

    def test_intense_rain_raises_the_band_even_before_water_accumulates(self):
        """A cloudburst in progress is not 'no risk' just because nothing has pooled yet."""
        assert fe.classify_risk(0.0, peak_intensity_mm_hr=35.0) == "HIGH"


class TestProvenance:
    def test_without_a_model_the_result_is_labelled_heuristic(self):
        fe.load_surrogate.cache_clear()
        estimate = fe.estimate_depth(
            hourly_rainfall_mm=[0, 30, 30, 0, 0, 0],
            slope_deg=0.75, elevation_m=12.0, impermeability_pct=65.0,
        )
        assert estimate.method == "heuristic"
        assert estimate.data_status == "heuristic"
        assert estimate.caveats, "a heuristic result must carry its caveats"

    def test_workings_are_exposed_so_the_number_can_be_checked(self):
        estimate = fe.estimate_depth(
            hourly_rainfall_mm=[0, 30, 30, 0, 0, 0],
            slope_deg=0.75, elevation_m=12.0, impermeability_pct=65.0,
        )
        for key in ("runoff_coefficient", "excess_runoff_mm", "ponding_area_fraction"):
            assert key in estimate.inputs

    def test_an_absent_model_is_reported_as_absent(self):
        fe.load_surrogate.cache_clear()
        info = fe.surrogate_status()
        if not info.available:
            assert not info.validated
            assert info.reason
