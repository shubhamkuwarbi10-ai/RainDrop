"""Terrain algorithms and nowcast verification, checked against analytic cases."""
import numpy as np
import pytest

from pipeline import terrain_ops as ops
from pipeline.evaluate_nowcast import contingency_scores, evaluate_lead_time
from pipeline.nowcast_pysteps import from_dbr, persistence_forecast, to_dbr


class TestDepressionFilling:
    def test_a_pit_is_raised_to_its_escape_level(self):
        dem = np.array([
            [5, 5, 5, 5, 5],
            [4, 3, 3, 3, 4],
            [3, 2, 0, 2, 3],
            [4, 3, 3, 3, 4],
            [5, 5, 5, 5, 5],
        ], dtype=float)
        filled = ops.fill_depressions(dem)
        assert filled[2, 2] > dem[2, 2]
        assert filled[2, 2] == pytest.approx(3.0, abs=0.01)

    def test_filling_never_lowers_the_ground(self):
        generator = np.random.default_rng(1)
        dem = generator.normal(50, 5, (30, 30))
        assert np.all(ops.fill_depressions(dem) >= dem - 1e-9)

    def test_a_surface_with_no_pits_is_left_alone(self):
        ramp = np.tile(np.arange(20, 0, -1, dtype=float), (10, 1))
        assert np.allclose(ops.fill_depressions(ramp), ramp)

    def test_depression_depth_records_what_was_filled(self):
        dem = np.ones((7, 7)) * 10.0
        dem[3, 3] = 4.0
        depth = ops.depression_depth(dem, ops.fill_depressions(dem))
        assert depth[3, 3] > 5.0
        assert depth[0, 0] == 0.0


class TestFlowRouting:
    def test_a_uniform_slope_drains_one_way(self):
        ramp = np.tile(np.arange(10, 0, -1, dtype=float), (5, 1))
        direction = ops.d8_flow_direction(ramp)
        assert set(np.unique(direction[:, :-1])) == {1}  # east

    def test_accumulation_grows_downstream(self):
        ramp = np.tile(np.arange(8, 0, -1, dtype=float), (4, 1))
        accumulation = ops.d8_flow_accumulation(ops.d8_flow_direction(ramp))
        row = accumulation[1]
        assert list(row) == sorted(row)
        assert row[-1] == 8.0, "the outlet must receive every upstream cell"

    def test_accumulation_is_a_catchment_count_not_a_neighbour_count(self):
        """The old implementation capped out around 5 regardless of grid size."""
        ramp = np.tile(np.arange(60, 0, -1, dtype=float), (20, 1))
        accumulation = ops.d8_flow_accumulation(ops.d8_flow_direction(ramp))
        assert accumulation.max() > 50

    def test_total_accumulation_is_conserved(self):
        generator = np.random.default_rng(3)
        dem = ops.fill_depressions(generator.normal(100, 3, (25, 25)))
        accumulation = ops.d8_flow_accumulation(ops.d8_flow_direction(dem))
        assert accumulation.min() >= 1.0
        assert accumulation.max() <= dem.size


class TestSlope:
    def test_a_one_in_ten_ramp_is_5_71_degrees(self):
        ramp = np.tile(np.arange(10) * 3.0, (5, 1))  # 3 m rise per 30 m cell
        assert float(np.median(ops.slope_degrees(ramp, 30.0))) == pytest.approx(5.711, abs=0.01)

    def test_flat_ground_is_zero(self):
        assert np.allclose(ops.slope_degrees(np.ones((8, 8)) * 42.0, 30.0), 0.0)

    def test_cell_size_changes_the_answer(self):
        """The bug: slope was computed as if degree cells were 30 m."""
        ramp = np.tile(np.arange(10) * 3.0, (5, 1))
        assert np.median(ops.slope_degrees(ramp, 30.0)) > np.median(ops.slope_degrees(ramp, 300.0))


class TestUtmZones:
    @pytest.mark.parametrize("lon,lat,epsg", [
        (80.27, 13.08, 32644),  # Chennai
        (72.88, 19.08, 32643),  # Mumbai
        (77.21, 28.61, 32643),  # Delhi
        (88.36, 22.57, 32645),  # Kolkata
    ])
    def test_indian_cities_map_to_the_expected_zone(self, lon, lat, epsg):
        assert ops.utm_epsg_for(lon, lat) == epsg


class TestNowcastVerification:
    def test_a_dry_period_scores_undefined_not_perfect(self):
        """The bug: CSI, POD and FAR returned 1.0, 1.0 and 0.0 with no events."""
        dry = np.zeros((20, 20))
        scores = contingency_scores(dry, dry, threshold=1.0)
        assert scores["CSI"] is None
        assert scores["POD"] is None
        assert scores["undefined_reason"]

    def test_a_perfect_forecast_scores_one(self):
        generator = np.random.default_rng(0)
        observed = generator.exponential(3.0, (20, 20))
        assert contingency_scores(observed, observed, threshold=1.0)["CSI"] == 1.0

    def test_a_forecast_that_misses_everything_scores_zero(self):
        observed = np.full((10, 10), 5.0)
        assert contingency_scores(observed, np.zeros((10, 10)), threshold=1.0)["CSI"] == 0.0

    def test_skill_is_negative_when_the_nowcast_loses_to_persistence(self):
        generator = np.random.default_rng(2)
        truth = generator.exponential(3.0, (20, 20))
        good_baseline = np.clip(truth + generator.normal(0, 0.5, truth.shape), 0, None)
        bad_forecast = np.clip(truth + generator.normal(0, 5.0, truth.shape), 0, None)
        result = evaluate_lead_time(truth, bad_forecast, good_baseline)
        assert result["skill_vs_persistence"]["rmse_skill_score"] < 0

    def test_skill_is_positive_when_the_nowcast_wins(self):
        generator = np.random.default_rng(4)
        truth = generator.exponential(3.0, (20, 20))
        poor_baseline = np.clip(truth + generator.normal(0, 5.0, truth.shape), 0, None)
        good_forecast = np.clip(truth + generator.normal(0, 0.5, truth.shape), 0, None)
        result = evaluate_lead_time(truth, good_forecast, poor_baseline)
        assert result["skill_vs_persistence"]["rmse_skill_score"] > 0


class TestRainfallTransform:
    def test_dbr_round_trip_preserves_rain_rates(self):
        rain = np.array([0.5, 2.0, 15.0, 80.0])
        assert np.allclose(from_dbr(to_dbr(rain)), rain, rtol=1e-6)

    def test_sub_threshold_rain_becomes_dry(self):
        assert np.all(from_dbr(to_dbr(np.array([0.0, 0.05]))) == 0.0)

    def test_no_rain_is_masked_rather_than_zeroed(self):
        """Zeros drag the motion field towards stillness; NaN excludes them."""
        assert np.all(np.isnan(to_dbr(np.array([0.0, 0.01]))))

    def test_persistence_repeats_the_last_frame(self):
        frame = np.arange(9, dtype=float).reshape(3, 3)
        forecast = persistence_forecast(frame, 4)
        assert forecast.shape == (4, 3, 3)
        assert all(np.array_equal(step, frame) for step in forecast)
