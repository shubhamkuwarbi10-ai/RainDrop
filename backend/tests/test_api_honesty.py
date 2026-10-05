"""Every response must say where its numbers came from.

These tests exist to stop the specific regressions the review found: endpoints
that returned constants, random numbers, or another city's data while claiming
to be live.
"""
import pytest

from app.api import ml_gis
from app.core import data_status as ds
from app.domain import cities

VALID_STATUSES = {ds.LIVE, ds.HEURISTIC, ds.DEMO, ds.UNAVAILABLE}


class TestProvenanceEnvelope:
    @pytest.mark.parametrize("call", [
        lambda: ml_gis.cities(),
        lambda: ml_gis.metrics(),
        lambda: ml_gis.model_status(),
        lambda: ml_gis.telemetry_status(),
        lambda: ml_gis.dem_summary(city="chennai"),
        lambda: ml_gis.drainage("chennai"),
        lambda: ml_gis.route_check(city="chennai", depth_cm=10.0),
    ])
    def test_every_endpoint_declares_its_data_status(self, call):
        provenance = call()["provenance"]
        assert provenance["data_status"] in VALID_STATUSES
        assert provenance["method"], "an endpoint must name what produced its numbers"

    def test_no_endpoint_claims_to_be_a_real_api(self):
        """is_real_api was hardcoded true regardless of what ran."""
        for payload in (ml_gis.cities(), ml_gis.telemetry_status(), ml_gis.model_status()):
            assert "is_real_api" not in payload


class TestMetricsAreNotInvented:
    def test_metrics_report_unavailable_without_a_verification_run(self, monkeypatch, tmp_path):
        monkeypatch.setattr(ml_gis, "NOWCAST_REPORT_FILE", tmp_path / "nothing.json")
        result = ml_gis.metrics()
        assert result["verification"] is None
        assert result["provenance"]["data_status"] == ds.UNAVAILABLE

    def test_metrics_are_stable_across_calls(self):
        """They used to come from np.random, so two calls disagreed."""
        assert ml_gis.metrics()["verification"] == ml_gis.metrics()["verification"]


class TestTelemetryIsNotFabricated:
    def test_absent_feeds_are_reported_as_absent(self):
        feeds = ml_gis.telemetry_status()["feeds"]
        for name in ("ground_sensors", "doppler_radar", "pump_telemetry"):
            assert feeds[name]["connected"] is False
            assert feeds[name]["data_status"] == ds.UNAVAILABLE
            assert feeds[name]["note"]

    def test_no_sensor_count_is_claimed(self):
        """The old endpoint reported a constant '48 of 50 sensors'."""
        feeds = ml_gis.telemetry_status()["feeds"]
        assert "active_sensors" not in feeds["ground_sensors"]


class TestPerCityData:
    @pytest.mark.parametrize("city", ["chennai", "mumbai", "delhi"])
    def test_each_city_gets_its_own_corridor(self, city):
        result = ml_gis.route_check(city=city, depth_cm=10.0)
        assert result["suggested_corridor"]["name"] == cities.CITY_CORRIDORS[city]["name"]

    def test_corridors_are_distinct_between_cities(self):
        """One Mumbai corridor was returned for every city."""
        names = {
            ml_gis.route_check(city=city, depth_cm=10.0)["suggested_corridor"]["name"]
            for city in ("chennai", "mumbai", "delhi")
        }
        assert len(names) == 3

    def test_no_corridor_promises_dry_passage(self):
        """The old copy guaranteed '100% dry'."""
        for city in cities.CITY_CORRIDORS:
            blob = str(ml_gis.route_check(city=city, depth_cm=10.0)).lower()
            assert "100%" not in blob
            assert "guarantee" not in blob

    def test_route_check_is_labelled_demo(self):
        assert ml_gis.route_check(city="chennai", depth_cm=10.0)["provenance"]["data_status"] == ds.DEMO


class TestPassabilityGuidance:
    def test_deep_water_stops_every_mode(self):
        for row in ml_gis.passability_guidance(80.0):
            assert row["verdict"] == "do_not_enter"

    def test_dry_road_is_passable_for_every_mode(self):
        for row in ml_gis.passability_guidance(0.0):
            assert row["verdict"] == "passable"

    def test_higher_vehicles_tolerate_deeper_water(self):
        """At 25 cm a scooter must turn back while a bus can still pass."""
        guidance = {row["mode"]: row["verdict"] for row in ml_gis.passability_guidance(25.0)}
        assert guidance["Two-wheeler"] == "do_not_enter"
        assert guidance["Car"] == "risky"
        assert guidance["Bus or truck"] == "passable"

    def test_guidance_covers_every_mode_at_every_depth(self):
        for depth in (0, 5, 12, 18, 25, 40, 100):
            modes = {row["mode"] for row in ml_gis.passability_guidance(depth)}
            assert modes == {"Walking", "Two-wheeler", "Car", "Bus or truck"}


class TestTerrainProvenance:
    def test_dem_provenance_matches_what_is_on_disk(self):
        """Four cities used to claim real ISRO CartoDEM with no tile anywhere."""
        for city_key, profile in cities.CITY_TERRAINS.items():
            block = ml_gis._terrain_block(profile)
            claims_raster = block["derived_from_raster"]
            summary_exists = cities.dem_summary_file(city_key).is_file()
            if claims_raster:
                assert summary_exists, f"{city_key} claims raster-derived terrain with no summary on disk"

    def test_unprocessed_city_is_labelled_heuristic(self):
        result = ml_gis.dem_summary(city="kolkata")
        if not result["terrain"]["derived_from_raster"]:
            assert result["provenance"]["data_status"] == ds.HEURISTIC
            assert result["provenance"]["caveats"]


class TestWardResolution:
    def test_a_known_ward_resolves(self):
        city_key, ward, matched = cities.resolve_ward_info("Velachery", "chennai")
        assert (city_key, ward["name"], matched) == ("chennai", "Velachery", True)

    def test_an_unknown_ward_is_flagged_rather_than_silently_substituted(self):
        _, _, matched = cities.resolve_ward_info("Nowhere At All", "delhi")
        assert matched is False

    def test_a_point_outside_every_city_is_detected(self):
        assert cities.is_inside_any_city(13.08, 80.27)      # Chennai
        assert not cities.is_inside_any_city(51.50, -0.12)  # London
