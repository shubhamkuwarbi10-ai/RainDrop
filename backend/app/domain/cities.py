"""City, ward and terrain reference data.

Terrain figures below are *fallback* city-scale averages used only until a real
CartoDEM tile has been processed for that city. Nothing here claims to be
satellite-derived: `dem_source` starts as "fallback" for every city and is
upgraded to "cartodem" only by `load_dem_summaries()`, and only when a summary
written by `pipeline/process_dem.py` from an actual raster is found on disk.

Chennai, Mumbai and Delhi are the focus cities (see `config.FOCUS_CITIES`); the
other three are included for breadth and are explicitly marked lower confidence.
"""
from __future__ import annotations

import json
from typing import Any

from app.core.paths import dem_summary_file

# dem_source values and what each one means.
DEM_FALLBACK = "fallback"      # City-scale average from published literature; no raster.
DEM_CARTODEM = "cartodem"      # Derived from a processed CartoDEM/SRTM raster on disk.

_FALLBACK_LABEL = "City-scale average (no DEM raster processed yet)"

# slope_deg / elevation_m / impermeability_pct are coarse city averages, good
# enough to keep the heuristic in a sane range and nothing more.
CITY_TERRAINS: dict[str, dict[str, Any]] = {
    "chennai": {
        "name": "Chennai", "state": "Tamil Nadu", "focus": True,
        "lat": 13.0827, "lon": 80.2707,
        "lat_min": 12.85, "lat_max": 13.30, "lon_min": 80.05, "lon_max": 80.45,
        "utm_epsg": 32644,
        "slope": 0.75, "elevation": 12.94, "impermeability": 65.0,
        "dem_source": DEM_FALLBACK, "dem_source_label": _FALLBACK_LABEL,
    },
    "mumbai": {
        "name": "Mumbai", "state": "Maharashtra", "focus": True,
        "lat": 19.0760, "lon": 72.8777,
        "lat_min": 18.85, "lat_max": 19.25, "lon_min": 72.70, "lon_max": 73.05,
        "utm_epsg": 32643,
        "slope": 1.85, "elevation": 8.50, "impermeability": 75.0,
        "dem_source": DEM_FALLBACK, "dem_source_label": _FALLBACK_LABEL,
    },
    "delhi": {
        "name": "Delhi", "state": "Delhi (NCT)", "focus": True,
        "lat": 28.6139, "lon": 77.2090,
        "lat_min": 28.35, "lat_max": 28.95, "lon_min": 76.80, "lon_max": 77.45,
        "utm_epsg": 32643,
        "slope": 0.45, "elevation": 215.0, "impermeability": 60.0,
        "dem_source": DEM_FALLBACK, "dem_source_label": _FALLBACK_LABEL,
    },
    "bengaluru": {
        "name": "Bengaluru", "state": "Karnataka", "focus": False,
        "lat": 12.9716, "lon": 77.5946,
        "lat_min": 12.80, "lat_max": 13.15, "lon_min": 77.45, "lon_max": 77.78,
        "utm_epsg": 32643,
        "slope": 1.45, "elevation": 920.0, "impermeability": 70.0,
        "dem_source": DEM_FALLBACK, "dem_source_label": _FALLBACK_LABEL,
    },
    "kolkata": {
        "name": "Kolkata", "state": "West Bengal", "focus": False,
        "lat": 22.5726, "lon": 88.3639,
        "lat_min": 22.40, "lat_max": 22.70, "lon_min": 88.25, "lon_max": 88.50,
        "utm_epsg": 32645,
        "slope": 0.35, "elevation": 9.00, "impermeability": 78.0,
        "dem_source": DEM_FALLBACK, "dem_source_label": _FALLBACK_LABEL,
    },
    "hyderabad": {
        "name": "Hyderabad", "state": "Telangana", "focus": False,
        "lat": 17.3850, "lon": 78.4867,
        "lat_min": 17.25, "lat_max": 17.55, "lon_min": 78.30, "lon_max": 78.60,
        "utm_epsg": 32644,
        "slope": 1.20, "elevation": 505.0, "impermeability": 68.0,
        "dem_source": DEM_FALLBACK, "dem_source_label": _FALLBACK_LABEL,
    },
}

METRO_REGISTRY = {
    "chennai": {
        "name": "Chennai",
        "state": "Tamil Nadu",
        "center": [13.0827, 80.2707],
        "wards": {
            "Velachery": {
                "name": "Velachery",
                "code": "Ward 177-VEL",
                "lat": 12.975,
                "lon": 80.221,
                "river_name": "Pallikaranai Marshland Outlet",
                "danger_level_m": 4.30,
                "base_water_level_m": 2.20,
                "total_pumps": 16
            },
            "Chennai Central (Adyar)": {
                "name": "Chennai Central (Adyar)",
                "code": "Ward 170-Adyar",
                "lat": 13.022,
                "lon": 80.241,
                "river_name": "Adyar River Basin",
                "danger_level_m": 4.50,
                "base_water_level_m": 2.80,
                "total_pumps": 16
            },
            "Chennai North (Otteri)": {
                "name": "Chennai North (Otteri)",
                "code": "Ward 074-Otteri",
                "lat": 13.097,
                "lon": 80.264,
                "river_name": "Otteri Nullah Channel",
                "danger_level_m": 3.40,
                "base_water_level_m": 1.90,
                "total_pumps": 12
            },
            "T. Nagar (Cooum)": {
                "name": "T. Nagar (Cooum)",
                "code": "Ward 113-Cooum",
                "lat": 13.041,
                "lon": 80.233,
                "river_name": "Cooum River Spillway",
                "danger_level_m": 4.20,
                "base_water_level_m": 2.40,
                "total_pumps": 12
            },
            "Anna Nagar": {
                "name": "Anna Nagar",
                "code": "Ward 102-ANN",
                "lat": 13.083,
                "lon": 80.218,
                "river_name": "Otteri Nullah West Extension",
                "danger_level_m": 3.30,
                "base_water_level_m": 1.70,
                "total_pumps": 10
            },
            "Madipakkam": {
                "name": "Madipakkam",
                "code": "Ward 188-MDP",
                "lat": 12.962,
                "lon": 80.198,
                "river_name": "Kilkattalai Surplus Channel",
                "danger_level_m": 3.90,
                "base_water_level_m": 1.80,
                "total_pumps": 14
            }
        }
    },
    "mumbai": {
        "name": "Mumbai",
        "state": "Maharashtra",
        "center": [19.0760, 72.8777],
        "wards": {
            "Kurla West": {
                "name": "Kurla West",
                "code": "Ward 184-L",
                "lat": 19.068,
                "lon": 72.879,
                "river_name": "Mithi River Corridor",
                "danger_level_m": 3.80,
                "base_water_level_m": 2.40,
                "total_pumps": 12
            },
            "Kurla East": {
                "name": "Kurla East",
                "code": "Ward 185-L",
                "lat": 19.061,
                "lon": 72.894,
                "river_name": "Eastern Nullah Trunk",
                "danger_level_m": 3.20,
                "base_water_level_m": 1.60,
                "total_pumps": 8
            },
            "Chembur": {
                "name": "Chembur",
                "code": "Ward 152-M",
                "lat": 19.055,
                "lon": 72.902,
                "river_name": "Mahul Creek Drainage",
                "danger_level_m": 3.10,
                "base_water_level_m": 1.50,
                "total_pumps": 8
            },
            "Andheri West": {
                "name": "Andheri West",
                "code": "Ward 064-K",
                "lat": 19.104,
                "lon": 72.842,
                "river_name": "Oshiwara River Basin",
                "danger_level_m": 3.60,
                "base_water_level_m": 2.10,
                "total_pumps": 14
            },
            "Dadar West": {
                "name": "Dadar West",
                "code": "Ward 191-GN",
                "lat": 19.008,
                "lon": 72.842,
                "river_name": "Portuguese Church Drain",
                "danger_level_m": 3.50,
                "base_water_level_m": 2.00,
                "total_pumps": 10
            },
            "Vikhroli": {
                "name": "Vikhroli",
                "code": "Ward 121-S",
                "lat": 19.102,
                "lon": 72.930,
                "river_name": "Thane Creek Spillway",
                "danger_level_m": 3.50,
                "base_water_level_m": 1.40,
                "total_pumps": 6
            }
        }
    },
    "delhi": {
        "name": "Delhi",
        "state": "National Capital Territory",
        "center": [28.6139, 77.2090],
        "wards": {
            "Yamuna Floodplain (ITO)": {
                "name": "Yamuna Floodplain (ITO)",
                "code": "NCR Ward 042-ITO",
                "lat": 28.628,
                "lon": 77.248,
                "river_name": "Yamuna River Main Trunk",
                "danger_level_m": 205.33,
                "base_water_level_m": 204.10,
                "total_pumps": 20
            },
            "Barapullah Corridor": {
                "name": "Barapullah Corridor",
                "code": "NCR Ward 088-BRP",
                "lat": 28.591,
                "lon": 77.252,
                "river_name": "Barapullah Nallah",
                "danger_level_m": 205.20,
                "base_water_level_m": 203.80,
                "total_pumps": 10
            },
            "Najafgarh Basin": {
                "name": "Najafgarh Basin",
                "code": "NCR Ward 108-NJF",
                "lat": 28.571,
                "lon": 77.068,
                "river_name": "Najafgarh Drain Channel",
                "danger_level_m": 205.00,
                "base_water_level_m": 203.50,
                "total_pumps": 14
            },
            "Okhla Industrial Zone": {
                "name": "Okhla Industrial Zone",
                "code": "NCR Ward 096-OKH",
                "lat": 28.535,
                "lon": 77.272,
                "river_name": "Agra Canal Headworks",
                "danger_level_m": 205.40,
                "base_water_level_m": 204.20,
                "total_pumps": 15
            },
            "Minto Bridge Corridor": {
                "name": "Minto Bridge Corridor",
                "code": "NCR Ward 031-MNT",
                "lat": 28.634,
                "lon": 77.225,
                "river_name": "Connaught Place Trunk Drain",
                "danger_level_m": 205.10,
                "base_water_level_m": 203.90,
                "total_pumps": 16
            }
        }
    },
    "bengaluru": {
        "name": "Bengaluru",
        "state": "Karnataka",
        "center": [12.9716, 77.5946],
        "wards": {
            "Bellandur Lake Basin": {
                "name": "Bellandur Lake Basin",
                "code": "BBMP Ward 150-BLR",
                "lat": 12.935,
                "lon": 77.674,
                "river_name": "K-Valley Stormwater Drain",
                "danger_level_m": 885.00,
                "base_water_level_m": 883.20,
                "total_pumps": 14
            },
            "Koramangala Valley": {
                "name": "Koramangala Valley",
                "code": "BBMP Ward 151-KRM",
                "lat": 12.934,
                "lon": 77.618,
                "river_name": "Koramangala Intermediate Drain",
                "danger_level_m": 892.00,
                "base_water_level_m": 890.10,
                "total_pumps": 10
            },
            "HSR Layout Sector 6": {
                "name": "HSR Layout Sector 6",
                "code": "BBMP Ward 174-HSR",
                "lat": 12.912,
                "lon": 77.638,
                "river_name": "Silk Board Feeder Canal",
                "danger_level_m": 898.00,
                "base_water_level_m": 896.30,
                "total_pumps": 12
            },
            "Manyata Tech Park": {
                "name": "Manyata Tech Park",
                "code": "BBMP Ward 024-MNY",
                "lat": 13.048,
                "lon": 77.620,
                "river_name": "Hebbal Lake Surplus Channel",
                "danger_level_m": 915.00,
                "base_water_level_m": 913.40,
                "total_pumps": 16
            },
            "Varthur Spillway": {
                "name": "Varthur Spillway",
                "code": "BBMP Ward 149-VTR",
                "lat": 12.941,
                "lon": 77.746,
                "river_name": "Dakshina Pinakini Basin",
                "danger_level_m": 878.00,
                "base_water_level_m": 876.10,
                "total_pumps": 10
            }
        }
    },
    "kolkata": {
        "name": "Kolkata",
        "state": "West Bengal",
        "center": [22.5726, 88.3639],
        "wards": {
            "Circular Canal & Ultadanga": {
                "name": "Circular Canal & Ultadanga",
                "code": "KMC Ward 013-ULT",
                "lat": 22.597,
                "lon": 88.384,
                "river_name": "Circular Canal Outfall",
                "danger_level_m": 6.80,
                "base_water_level_m": 4.50,
                "total_pumps": 18
            },
            "Park Circus Connector": {
                "name": "Park Circus Connector",
                "code": "KMC Ward 059-PKC",
                "lat": 22.544,
                "lon": 88.375,
                "river_name": "Eastern Drainage Channel",
                "danger_level_m": 6.50,
                "base_water_level_m": 4.20,
                "total_pumps": 14
            },
            "Tolly's Nullah (Kalighat)": {
                "name": "Tolly's Nullah (Kalighat)",
                "code": "KMC Ward 083-KLG",
                "lat": 22.520,
                "lon": 88.347,
                "river_name": "Adi Ganga / Tolly's Nullah",
                "danger_level_m": 5.90,
                "base_water_level_m": 3.80,
                "total_pumps": 12
            },
            "Salt Lake Sector V": {
                "name": "Salt Lake Sector V",
                "code": "BMC Ward 031-SLK",
                "lat": 22.573,
                "lon": 88.433,
                "river_name": "East Kolkata Wetlands Canal",
                "danger_level_m": 5.50,
                "base_water_level_m": 3.10,
                "total_pumps": 16
            },
            "Behala Lowlands": {
                "name": "Behala Lowlands",
                "code": "KMC Ward 118-BHL",
                "lat": 22.496,
                "lon": 88.315,
                "river_name": "Churial Canal Sump",
                "danger_level_m": 5.20,
                "base_water_level_m": 3.00,
                "total_pumps": 12
            }
        }
    },
    "hyderabad": {
        "name": "Hyderabad",
        "state": "Telangana",
        "center": [17.3850, 78.4867],
        "wards": {
            "Musi River Corridor": {
                "name": "Musi River Corridor",
                "code": "GHMC Ward 045-MSI",
                "lat": 17.368,
                "lon": 78.487,
                "river_name": "Musi River Central Channel",
                "danger_level_m": 508.50,
                "base_water_level_m": 505.20,
                "total_pumps": 16
            },
            "Begumpet Nala": {
                "name": "Begumpet Nala",
                "code": "GHMC Ward 149-BGP",
                "lat": 17.444,
                "lon": 78.468,
                "river_name": "Begumpet Major Storm Drain",
                "danger_level_m": 515.00,
                "base_water_level_m": 512.60,
                "total_pumps": 12
            },
            "Hussain Sagar Surplus": {
                "name": "Hussain Sagar Surplus",
                "code": "GHMC Ward 092-HSR",
                "lat": 17.424,
                "lon": 78.475,
                "river_name": "Hussain Sagar Outlet Weir",
                "danger_level_m": 514.20,
                "base_water_level_m": 512.00,
                "total_pumps": 14
            },
            "Kukatpally Y-Junction": {
                "name": "Kukatpally Y-Junction",
                "code": "GHMC Ward 120-KPT",
                "lat": 17.493,
                "lon": 78.398,
                "river_name": "IDL Lake Drainage Runoff",
                "danger_level_m": 528.00,
                "base_water_level_m": 525.40,
                "total_pumps": 10
            },
            "Tolichowki Basin": {
                "name": "Tolichowki Basin",
                "code": "GHMC Ward 071-TCK",
                "lat": 17.401,
                "lon": 78.412,
                "river_name": "Shah Hatim Talab Drain",
                "danger_level_m": 512.00,
                "base_water_level_m": 509.30,
                "total_pumps": 12
            }
        }
    }
}


# ---------------------------------------------------------------------------
# Reference evacuation corridors
# ---------------------------------------------------------------------------
# These are real, named elevated roads in each city, held here as reference
# geography. They are NOT routed against a live road network and carry no
# guarantee of being passable: every response built from this table is labelled
# data_status="demo". Before the review these were a single hardcoded Mumbai
# corridor shown to users in every city, including a "100% dry" claim.
CITY_CORRIDORS: dict[str, dict[str, Any]] = {
    "chennai": {
        "name": "Inner Ring Road via Kathipara Flyover",
        "summary": "Elevated east-west link from Velachery and Guindy towards the Chennai Port side.",
        "waypoints": ["Velachery Main Road", "Kathipara Junction flyover", "Anna Salai", "Chennai Central"],
        "typical_detour_min": 8,
    },
    "mumbai": {
        "name": "Santacruz-Chembur Link Road (Kalina elevated section)",
        "summary": "Elevated link avoiding the Mithi river floodplain between the eastern and western suburbs.",
        "waypoints": ["Kurla West", "Kalina elevated ramp", "SCLR flyover deck", "BKC"],
        "typical_detour_min": 6,
    },
    "delhi": {
        "name": "Barapullah Elevated Corridor",
        "summary": "Elevated corridor over the Barapullah drain linking south and central Delhi.",
        "waypoints": ["Sarai Kale Khan", "Barapullah deck", "Jawaharlal Nehru Stadium", "INA"],
        "typical_detour_min": 7,
    },
    "bengaluru": {
        "name": "NH-44 Elevated Expressway (Silk Board to Electronic City)",
        "summary": "Elevated expressway over the Hosur Road corridor, above the Bellandur catchment lowlands.",
        "waypoints": ["Central Silk Board", "Bommanahalli ramp", "Elevated deck", "Electronic City"],
        "typical_detour_min": 9,
    },
    "kolkata": {
        "name": "Maa Flyover and AJC Bose Road Flyover",
        "summary": "Continuous flyover chain across central Kolkata, above the surface drainage network.",
        "waypoints": ["Park Circus", "Maa Flyover deck", "AJC Bose Road flyover", "Esplanade"],
        "typical_detour_min": 6,
    },
    "hyderabad": {
        "name": "PVNR Elevated Expressway",
        "summary": "Long elevated expressway bypassing the low-lying Musi river crossings.",
        "waypoints": ["Mehdipatnam", "PVNR deck", "Aramghar junction", "Shamshabad"],
        "typical_detour_min": 10,
    },
}

DEFAULT_CORRIDOR: dict[str, Any] = {
    "name": "Nearest elevated road",
    "summary": "No reference corridor is on file for this city.",
    "waypoints": [],
    "typical_detour_min": None,
}


# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

def load_dem_summaries() -> None:
    """Overlay real terrain stats where a processed DEM summary exists.

    Called once at import. A city only gets dem_source="cartodem" when the
    summary on disk says the pipeline actually read a raster.
    """
    for city_key, profile in CITY_TERRAINS.items():
        summary_path = dem_summary_file(city_key)
        if not summary_path.is_file():
            continue
        try:
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            print(f"[!] Could not read DEM summary for {city_key}: {exc.__class__.__name__}")
            continue

        source = summary.get("dem_source", {})
        is_real = bool(source.get("is_real_dem"))
        profile["slope"] = summary.get("slope_deg", {}).get("mean", profile["slope"])
        profile["elevation"] = summary.get("elevation_m", {}).get("mean", profile["elevation"])
        profile["dem_source"] = DEM_CARTODEM if is_real else DEM_FALLBACK
        profile["dem_source_label"] = source.get("label", profile["dem_source_label"])
        profile["dem_summary_path"] = str(summary_path)


def resolve_city_key(city: str | None, default: str = "chennai") -> str:
    key = (city or "").strip().lower()
    return key if key in CITY_TERRAINS else default


def get_city_terrain(lat: float, lon: float, city_hint: str | None = None) -> dict[str, Any]:
    """Resolve a terrain profile by explicit hint, else by bounding box."""
    if city_hint:
        hinted = (city_hint or "").strip().lower()
        if hinted in CITY_TERRAINS:
            return CITY_TERRAINS[hinted]
    for profile in CITY_TERRAINS.values():
        if profile["lat_min"] <= lat <= profile["lat_max"] and profile["lon_min"] <= lon <= profile["lon_max"]:
            return profile
    return CITY_TERRAINS["chennai"]


def is_inside_any_city(lat: float, lon: float) -> bool:
    """True when the point falls inside a supported city box.

    Callers use this to avoid presenting a Chennai fallback profile as if it
    described somewhere it does not.
    """
    return any(
        profile["lat_min"] <= lat <= profile["lat_max"] and profile["lon_min"] <= lon <= profile["lon_max"]
        for profile in CITY_TERRAINS.values()
    )


def resolve_ward_info(ward_name: str, city_hint: str | None = None) -> tuple[str, dict[str, Any], bool]:
    """Look up a ward. Returns (city_key, ward, matched) - matched is False when
    the caller got a fallback rather than the ward it asked for."""
    cleaned = (ward_name or "").lower().strip()

    for city_key, registry in METRO_REGISTRY.items():
        if city_hint and city_key != (city_hint or "").strip().lower():
            continue
        for ward_key, ward in registry["wards"].items():
            normalised = ward_key.lower().strip()
            if cleaned and (cleaned == normalised or cleaned in normalised or normalised in cleaned):
                return city_key, ward, True

    hinted = (city_hint or "").strip().lower()
    if hinted in METRO_REGISTRY:
        return hinted, next(iter(METRO_REGISTRY[hinted]["wards"].values())), False

    return "chennai", METRO_REGISTRY["chennai"]["wards"]["Velachery"], False


def get_corridor(city_key: str) -> dict[str, Any]:
    return CITY_CORRIDORS.get(resolve_city_key(city_key), DEFAULT_CORRIDOR)


load_dem_summaries()
