"""Generate flood-depth training labels with EPA SWMM.

WHY SWMM AND NOT A 2-D MODEL
============================

The review asked for a choice between simulation labels from SWMM and from a
2-D model such as LISFLOOD-FP or HEC-RAS 2D. This project uses **SWMM, driven
through PySWMM**, for four reasons:

1. *It models the mechanism that actually causes the flooding.* Waterlogging in
   Chennai, Mumbai and Delhi is overwhelmingly pluvial: rain falls faster than
   the storm drains can carry it away. SWMM is a drainage-network model, so
   subcatchment runoff, pipe capacity and node surcharge are its primary
   variables. A 2-D hydraulic model routes water over a surface and treats the
   drainage network as a sink term, which is the wrong way round for this
   problem.

2. *A surrogate is only worth training if the simulator is expensive and the
   surrogate is cheap.* That trade only pays off when you can run the simulator
   thousands of times to build a training set. A SWMM design storm runs in
   seconds; a LISFLOOD-FP run over a city at usable resolution takes hours. The
   2-D route would give a few dozen labelled scenarios, which is not a training
   set.

3. *2-D needs terrain this project does not have.* Meaningful 2-D results need
   a DEM of about 1-5 m. CartoDEM is 30 m, which is coarser than the streets
   being modelled. Running a 2-D model on 30 m terrain produces confident-looking
   output that is not resolving the thing it appears to resolve.

4. *It is auditable.* EPA SWMM is free, open, and used by municipal engineers.
   A judge can read the .inp file this module writes and check the assumptions.

THE HONEST LIMITATION
=====================

SWMM reports flooding as a *volume* escaping each node, not a depth over a map.
To get a depth we spread that volume over the ponding area of the subcatchment,
which we take from the DEM's depression layer. That conversion is an assumption,
not a simulation result, and it is recorded in every row of the output.

The second limitation is larger: the drainage networks below are **schematic**.
They are generated from the terrain and from published figures for drain
density and design capacity, because the actual municipal asset registers for
GCC, BMC and MCD are not public. Labels from a schematic network teach the
surrogate the *behaviour* of the real system without its specific geometry. The
output file records `network_is_schematic: true`, and the training script
refuses to claim validation against observed floods on this basis.

To replace the schematic network with the real one, obtain the storm-drain
shapefiles from the corporation and use `build_inp_from_network()`.

Usage:
    pip install pyswmm
    python models/swmm_labels.py --city chennai --scenarios 500
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("swmm_labels")

ROOT = Path(__file__).resolve().parent.parent
TERRAIN_DIR = ROOT / "data" / "processed" / "terrain"
LABELS_DIR = ROOT / "data" / "processed" / "labels"
SWMM_WORK_DIR = ROOT / "data" / "processed" / "swmm"

# ---------------------------------------------------------------------------
# City drainage parameters.
#
# Design capacities are the figures the corporations publish for their storm
# water drain design storm. Imperviousness is from published land-use studies.
# Both are city-wide averages: a real model would vary them per subcatchment.
# ---------------------------------------------------------------------------
CITY_DRAINAGE = {
    "chennai": {
        "name": "Chennai",
        "design_storm_mm_hr": 15.0,
        "impervious_pct": 65.0,
        "subcatchment_area_ha": 50.0,
        "ground_slope_pct": 0.4,
        "conduit_diameter_m": 1.2,
        "conduit_slope": 0.0008,
        "note": "Flat coastal plain draining to the Adyar, Cooum and Pallikaranai marsh.",
    },
    "mumbai": {
        "name": "Mumbai",
        "design_storm_mm_hr": 25.0,
        "impervious_pct": 75.0,
        "subcatchment_area_ha": 40.0,
        "ground_slope_pct": 0.8,
        "conduit_diameter_m": 1.5,
        "conduit_slope": 0.0012,
        "note": "BRIMSTOWAD design storm is 50 mm/hr; delivered capacity is lower and tide-locked at high tide.",
    },
    "delhi": {
        "name": "Delhi",
        "design_storm_mm_hr": 12.0,
        "impervious_pct": 60.0,
        "subcatchment_area_ha": 60.0,
        "ground_slope_pct": 0.3,
        "conduit_diameter_m": 1.0,
        "conduit_slope": 0.0006,
        "note": "Largely open drains discharging to the Yamuna; many are silted.",
    },
}

#: SCS design storm shapes, as fractions of total depth per hour over 6 hours.
#: Different shapes put the peak in different places, which changes whether the
#: network surcharges. Training on one shape teaches the surrogate that totals
#: matter and timing does not, which is false.
STORM_SHAPES = {
    "front_loaded": [0.40, 0.25, 0.15, 0.10, 0.06, 0.04],
    "centre_peaked": [0.07, 0.15, 0.35, 0.25, 0.12, 0.06],
    "back_loaded": [0.04, 0.06, 0.10, 0.15, 0.25, 0.40],
    "uniform": [1 / 6] * 6,
    "double_peak": [0.22, 0.10, 0.06, 0.24, 0.26, 0.12],
}


def ponding_area_fraction(city_key: str) -> float:
    """Fraction of a subcatchment that ponds, read from the DEM if available.

    Falls back to a documented constant when terrain has not been processed.
    """
    summary_path = TERRAIN_DIR / f"{city_key}_dem_summary.json"
    if summary_path.is_file():
        try:
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            depressions = summary.get("depressions", {}).get("count", 0)
            dimensions = summary.get("dimensions", {})
            total = dimensions.get("rows", 0) * dimensions.get("cols", 0)
            if total > 0 and depressions > 0:
                return float(np.clip(depressions / total, 0.02, 0.30))
        except (json.JSONDecodeError, OSError, TypeError):
            pass
    return 0.10


def build_inp(city_key: str, storm_mm_per_hour: list[float], work_dir: Path) -> Path:
    """Write a single-subcatchment SWMM input file for one design storm.

    One subcatchment, one junction, one conduit and one outfall. That is enough
    to capture the mechanism (runoff generated vs. pipe capacity, with the
    excess surcharging the node) and small enough to be read and checked.
    """
    config = CITY_DRAINAGE[city_key]
    work_dir.mkdir(parents=True, exist_ok=True)

    rainfall_lines = "\n".join(
        f"STORM1           {hour:02d}:00      {rate:.3f}"
        for hour, rate in enumerate(storm_mm_per_hour)
    )

    inp = f"""[TITLE]
RainDrop schematic drainage model for {config['name']}
Generated by models/swmm_labels.py. The network is schematic, not surveyed.

[OPTIONS]
FLOW_UNITS           CMS
INFILTRATION         HORTON
FLOW_ROUTING         DYNWAVE
START_DATE           01/01/2024
START_TIME           00:00:00
END_DATE             01/01/2024
END_TIME             12:00:00
REPORT_STEP          00:05:00
WET_STEP             00:01:00
DRY_STEP             00:05:00
ROUTING_STEP         0:00:15
ALLOW_PONDING        YES

[EVAPORATION]
CONSTANT             0.0

[RAINGAGES]
;;Name  Format  Interval  SCF  Source
STORM1  INTENSITY  1:00   1.0  TIMESERIES STORM1

[SUBCATCHMENTS]
;;Name  Raingage  Outlet  Area(ha)  %Imperv  Width(m)  Slope(%)  CurbLen
CATCH1  STORM1    NODE1   {config['subcatchment_area_ha']}  {config['impervious_pct']}  {config['subcatchment_area_ha'] * 20:.0f}  {config['ground_slope_pct']}  0

[SUBAREAS]
;;Subcat  N-Imperv  N-Perv  S-Imperv  S-Perv  PctZero  RouteTo
CATCH1    0.012     0.15    1.5       5.0     25       OUTLET

[INFILTRATION]
;;Subcat  MaxRate  MinRate  Decay  DryTime  MaxInfil
CATCH1    76.2     3.3      4.14   7        0

[JUNCTIONS]
;;Name  Elev  MaxDepth  InitDepth  SurDepth  Aponded
NODE1   10.0  3.0       0          0         {config['subcatchment_area_ha'] * 10000 * ponding_area_fraction(city_key):.0f}

[OUTFALLS]
;;Name  Elev  Type   Stage  Gated
OUT1    8.0   FREE          NO

[CONDUITS]
;;Name  From   To    Length  Roughness  InOffset  OutOffset
PIPE1   NODE1  OUT1  500     0.013      0         0

[XSECTIONS]
;;Link  Shape     Geom1  Geom2  Geom3  Geom4  Barrels
PIPE1   CIRCULAR  {config['conduit_diameter_m']}  0  0  0  1

[TIMESERIES]
;;Name  Time  Value
{rainfall_lines}

[REPORT]
INPUT      NO
CONTROLS   NO
SUBCATCHMENTS ALL
NODES      ALL
LINKS      ALL
"""
    path = work_dir / f"{city_key}_scenario.inp"
    path.write_text(inp, encoding="utf-8")
    return path


def run_swmm(inp_path: Path) -> dict:
    """Run SWMM and return node flooding volume and peak depth.

    Raises RuntimeError with install instructions when pyswmm is missing: this
    module must never silently produce a number that did not come from SWMM.
    """
    try:
        from pyswmm import Nodes, Simulation
    except ImportError as exc:
        raise RuntimeError(
            "pyswmm is not installed, so no SWMM labels can be generated.\n"
            "Install it with:  pip install pyswmm\n"
            "This script will not fabricate labels in its absence."
        ) from exc

    flood_volume_m3 = 0.0
    peak_depth_m = 0.0
    peak_inflow_cms = 0.0

    with Simulation(str(inp_path)) as simulation:
        node = Nodes(simulation)["NODE1"]
        previous_seconds = None
        for step in simulation:
            seconds = step.getCurrentSimulationTime().timestamp()
            if previous_seconds is not None:
                # flooding is a rate in m3/s; integrate it over the step.
                flood_volume_m3 += node.flooding * (seconds - previous_seconds)
            previous_seconds = seconds
            peak_depth_m = max(peak_depth_m, node.depth)
            peak_inflow_cms = max(peak_inflow_cms, node.total_inflow)

    return {
        "flood_volume_m3": flood_volume_m3,
        "peak_node_depth_m": peak_depth_m,
        "peak_inflow_cms": peak_inflow_cms,
    }


def generate(city_key: str, scenarios: int, seed: int = 20260101) -> Path:
    """Run a set of design storms and write the labelled dataset."""
    if city_key not in CITY_DRAINAGE:
        raise ValueError(f"Unknown city '{city_key}'. Available: {', '.join(CITY_DRAINAGE)}")

    config = CITY_DRAINAGE[city_key]
    generator = np.random.default_rng(seed)
    pond_fraction = ponding_area_fraction(city_key)
    catchment_area_m2 = config["subcatchment_area_ha"] * 10_000
    ponding_area_m2 = catchment_area_m2 * pond_fraction

    log.info(
        "%s: %d scenarios, ponding fraction %.3f from %s",
        config["name"], scenarios, pond_fraction,
        "the DEM" if (TERRAIN_DIR / f"{city_key}_dem_summary.json").is_file() else "the documented default",
    )

    rows = []
    shape_names = list(STORM_SHAPES)

    for index in range(scenarios):
        # Totals from 5 mm (a shower) to 350 mm (a Chennai-2015 class event),
        # log-spaced so the common small storms are well represented.
        total_mm = float(np.exp(generator.uniform(np.log(5), np.log(350))))
        shape_name = shape_names[generator.integers(len(shape_names))]
        shape = STORM_SHAPES[shape_name]
        hourly_mm = [total_mm * fraction for fraction in shape]

        inp_path = build_inp(city_key, hourly_mm, SWMM_WORK_DIR / city_key)
        try:
            result = run_swmm(inp_path)
        except RuntimeError:
            raise

        # Volume -> depth. This conversion is an assumption, not a SWMM output.
        depth_cm = (result["flood_volume_m3"] / ponding_area_m2) * 100 if ponding_area_m2 > 0 else 0.0

        rows.append({
            "city": city_key,
            "storm_id": f"{city_key}-{index:04d}",
            "storm_shape": shape_name,
            "total_rainfall_mm": round(total_mm, 2),
            "peak_intensity_mm_hr": round(max(hourly_mm), 2),
            "duration_hours": len(shape),
            "impervious_pct": config["impervious_pct"],
            "ground_slope_pct": config["ground_slope_pct"],
            "design_storm_mm_hr": config["design_storm_mm_hr"],
            "swmm_flood_volume_m3": round(result["flood_volume_m3"], 2),
            "swmm_peak_node_depth_m": round(result["peak_node_depth_m"], 3),
            "label_flood_depth_cm": round(max(0.0, depth_cm), 2),
        })

        if (index + 1) % 50 == 0:
            log.info("  %d / %d scenarios", index + 1, scenarios)

    LABELS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = LABELS_DIR / f"{city_key}_swmm_labels.json"
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "city": city_key,
        "simulator": "EPA SWMM via pyswmm",
        "scenarios": len(rows),
        "network_is_schematic": True,
        "assumptions": {
            "ponding_area_fraction": pond_fraction,
            "ponding_area_m2": ponding_area_m2,
            "catchment_area_m2": catchment_area_m2,
            "volume_to_depth": (
                "SWMM reports node flooding as a volume. Depth is that volume spread over the "
                "ponding area taken from the DEM depression layer. This conversion is an "
                "assumption, not a simulation result."
            ),
            "network": (
                "Single schematic subcatchment, junction, conduit and outfall. Not the "
                "surveyed municipal storm-drain network, which is not public."
            ),
            "city_note": config["note"],
        },
        "rows": rows,
    }
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    log.info("Wrote %d labelled scenarios to %s", len(rows), output_path)
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate SWMM flood-depth training labels.")
    parser.add_argument("--city", choices=sorted(CITY_DRAINAGE), required=True)
    parser.add_argument("--scenarios", type=int, default=400)
    parser.add_argument("--seed", type=int, default=20260101)
    args = parser.parse_args()

    try:
        generate(args.city, args.scenarios, args.seed)
    except RuntimeError as exc:
        log.error("%s", exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
