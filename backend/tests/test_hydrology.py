import unittest

from app.services.drainage_solver import EdgeInput, manning_capacity_lps, solve_drainage_network
from app.services.terrain_processing import classify_flood_risk, estimate_runoff


class HydrologyTests(unittest.TestCase):
    def test_runoff_uses_impervious_fraction(self):
        result = estimate_runoff(50, 60, 10_000, 0.8)
        self.assertAlmostEqual(result["runoff_coefficient"], 0.76)
        self.assertAlmostEqual(result["runoff_volume_m3"], 380)

    def test_risk_thresholds(self):
        self.assertEqual(classify_flood_risk(0), "low")
        self.assertEqual(classify_flood_risk(5), "moderate")
        self.assertEqual(classify_flood_risk(15), "high")
        self.assertEqual(classify_flood_risk(30), "critical")

    def test_manning_capacity_is_positive(self):
        self.assertGreater(manning_capacity_lps(600, 0.01), 0)
        self.assertEqual(manning_capacity_lps(600, 0), 0)

    def test_network_reports_blockage_overload(self):
        result = solve_drainage_network(
            [EdgeInput(1, 1, 2, 10, None, None)],
            rainfall_runoff_lps=12,
            blockage_factor=0.2,
        )
        self.assertTrue(result["network_overloaded"])
        self.assertEqual(result["overloaded_edges"], 1)
        self.assertAlmostEqual(result["total_effective_capacity_lps"], 8)


if __name__ == "__main__":
    unittest.main()
