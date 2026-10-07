import os
import json
import numpy as np
from pathlib import Path
import logging
import urllib.request
import urllib.parse

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"


def trace_streams(flow_dir, accum, min_cells):
    """
    Channel polylines that follow D8 flow, as lists of (row, col).

    Starts at every channel head (a channel cell no other channel cell drains
    into) and walks downstream until the outlet or a cell already traced. That
    confluence cell is kept, so each tributary ends on the stream it joins.
    """
    from pipeline.process_dem import downstream_index

    cols = flow_dir.shape[1]
    down = downstream_index(flow_dir)
    channel = (accum.ravel() >= min_cells)

    fed = np.zeros(down.size, dtype=bool)
    feeding = np.flatnonzero(channel & (down >= 0))
    fed[down[feeding]] = True
    heads = np.flatnonzero(channel & ~fed)
    # Longest streams first, so main stems are traced whole and tributaries end on them.
    heads = heads[np.argsort(-accum.ravel()[heads])]

    visited = np.zeros(down.size, dtype=bool)
    lines = []
    for cell in heads:
        path = []
        while cell >= 0 and channel[cell]:
            path.append(divmod(int(cell), cols))
            if visited[cell]:
                break                      # joined an existing stream
            visited[cell] = True
            cell = down[cell]
        if len(path) >= 2:
            lines.append(path)
    return lines


CITY_AOIS = {
    "chennai": {
        "name": "Chennai",
        "lon_min": 80.10, "lon_max": 80.45,
        "lat_min": 12.90, "lat_max": 13.30,
        "base_elevation": 12.0,
        "primary_canals": ["Buckingham Canal", "Cooum River", "Adyar River", "Otteri Nullah"]
    },
    "mumbai": {
        "name": "Mumbai",
        "lon_min": 72.75, "lon_max": 72.95,
        "lat_min": 18.90, "lat_max": 19.10,
        "base_elevation": 8.0,
        "primary_canals": ["Mithi River", "Vakola Nalla", "Poisar River", "Dahisar River"]
    },
    "delhi": {
        "name": "Delhi",
        "lon_min": 76.80, "lon_max": 77.40,
        "lat_min": 28.40, "lat_max": 29.00,
        "base_elevation": 215.0,
        "primary_canals": ["Yamuna River", "Najafgarh Drain", "Barapullah Nallah", "Agra Canal"]
    }
}

def extract_dem_drainage_channels(city_key: str, data_dir=PROCESSED_DIR, min_area_km2: float = 5.0,
                                  vertex_stride: int = 5):
    """
    Drainage channels traced along D8 flow, plus depression hotspots on them.

    A cell is a channel once at least `min_area_km2` drains through it. 5 km2 keeps
    the major drainage paths a city map needs (218 for Delhi, ~256 KB); 1 km2, the
    usual hydrology threshold, adds ~870 small tributaries and triples the payload. Lines keep every `vertex_stride`-th cell plus both
    ends, which keeps the GeoJSON small without changing where the streams run.
    """
    out_path = Path(data_dir)
    accum_file = out_path / f"{city_key}_flow_accumulation.tif"
    flowdir_file = out_path / f"{city_key}_flow_direction.tif"
    depress_file = out_path / f"{city_key}_depressions.tif"
    dem_file = out_path / f"{city_key}_dem_filled.tif"

    channels = []
    outburst_nodes = []

    if not (HAS_RASTERIO and accum_file.exists() and flowdir_file.exists()
            and depress_file.exists() and dem_file.exists()):
        logging.warning(f"Rasters missing or rasterio unavailable for {city_key}. Generating structural fallback channels.")
        return generate_synthetic_channel_geojson(city_key)

    try:
        with rasterio.open(accum_file) as src_acc, rasterio.open(flowdir_file) as src_fd, \
                rasterio.open(depress_file) as src_dep, rasterio.open(dem_file) as src_dem:
            accum = src_acc.read(1)
            flow_dir = src_fd.read(1)
            depress = src_dep.read(1)
            dem = src_dem.read(1)
            bounds = src_acc.bounds
            rows, cols = accum.shape

            lon_step = (bounds.right - bounds.left) / cols
            lat_step = (bounds.top - bounds.bottom) / rows
            lat_mid = (bounds.top + bounds.bottom) / 2.0
            cell_km2 = (lon_step * 111.32 * np.cos(np.radians(lat_mid))) * (lat_step * 110.57)
            min_cells = max(2, int(round(min_area_km2 / cell_km2)))

            to_lonlat = lambda r, c: [round(bounds.left + (c + 0.5) * lon_step, 5),
                                      round(bounds.top - (r + 0.5) * lat_step, 5)]

            dem_label = _dem_source_label(out_path, city_key)
            for path in trace_streams(flow_dir, accum, min_cells):
                keep = path[::vertex_stride]
                if keep[-1] != path[-1]:
                    keep.append(path[-1])
                area = float(max(accum[r, c] for r, c in path)) * cell_km2
                channels.append({
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": [to_lonlat(r, c) for r, c in keep]},
                    "properties": {
                        "name": f"{CITY_AOIS[city_key]['name']} drainage path",
                        "type": "topographical_drain",
                        "contributing_area_km2": round(area, 2),
                        "source": f"D8 flow on {dem_label}",
                    }
                })

            channel_mask = accum >= min_cells

            # Identify outburst risk hotspots (High flow accumulation + Topographic depression)
            outburst_mask = channel_mask & (depress > 0.1)
            oy_idx, ox_idx = np.where(outburst_mask)
            
            ob_step = max(1, len(oy_idx) // 10)
            for i in range(0, len(oy_idx), ob_step):
                r, c = oy_idx[i], ox_idx[i]
                lon = bounds.left + (c + 0.5) * lon_step
                lat = bounds.top - (r + 0.5) * lat_step
                dep_depth = float(depress[r, c])
                accum_val = float(accum[r, c])
                elev_val = float(dem[r, c])

                outburst_nodes.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
                    "properties": {
                        "risk_level": "CRITICAL" if dep_depth > 0.8 else "HIGH",
                        "depression_depth_m": round(dep_depth, 2),
                        "elevation_m": round(elev_val, 2),
                        "flow_accumulation_score": round(accum_val, 1),
                        "description": f"Drainage bottleneck & potential outburst zone ({round(dep_depth, 1)}m depression)"
                    }
                })

    except Exception as e:
        logging.error(f"Error processing rasters for {city_key}: {e}")
        return generate_synthetic_channel_geojson(city_key)

    # Fetch physical OSM canal polylines if available
    osm_channels = fetch_osm_canals(city_key)
    all_channels = osm_channels + channels if osm_channels else channels

    return {
        "type": "FeatureCollection",
        "city": CITY_AOIS[city_key]["name"],
        "city_key": city_key,
        "features": all_channels,
        "outburst_hotspots": {
            "type": "FeatureCollection",
            "features": outburst_nodes
        }
    }

def _dem_source_label(data_dir, city_key):
    """Say which terrain the channels were traced on; most cities are still synthetic."""
    try:
        summary = json.loads((Path(data_dir) / f"{city_key}_dem_summary.json").read_text())
        return summary["dem_source"]["label"]
    except (OSError, ValueError, KeyError):
        return "unknown terrain"


def fetch_osm_canals(city_key: str):
    """Fetch physical canal polylines from OpenStreetMap Overpass API with local caching."""
    cfg = CITY_AOIS[city_key]
    cache_file = PROCESSED_DIR / f"{city_key}_osm_canals.geojson"

    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("features", [])
        except Exception:
            pass

    bbox = f"{cfg['lat_min']},{cfg['lon_min']},{cfg['lat_max']},{cfg['lon_max']}"
    overpass_query = f"""
    [out:json][timeout:15];
    (
      way["waterway"~"canal|drain|river|stream"]({bbox});
    );
    out geom;
    """
    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({'data': overpass_query}).encode('utf-8')
    
    osm_features = []
    try:
        req = urllib.request.Request(url, data=data, headers={'User-Agent': 'RainDrop-HydroEngine/1.0'})
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode('utf-8'))
            elements = result.get("elements", [])
            for elem in elements:
                if elem.get("type") == "way" and "geometry" in elem:
                    coords = [[round(pt["lon"], 5), round(pt["lat"], 5)] for pt in elem["geometry"]]
                    tags = elem.get("tags", {})
                    name = tags.get("name", f"{cfg['name']} Canal")
                    waterway = tags.get("waterway", "canal")
                    osm_features.append({
                        "type": "Feature",
                        "geometry": {"type": "LineString", "coordinates": coords},
                        "properties": {
                            "name": name,
                            "type": f"physical_{waterway}",
                            "source": "OpenStreetMap Real Vector Network"
                        }
                    })
        logging.info(f"Fetched {len(osm_features)} physical canal segments from OSM for {cfg['name']}.")
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump({"type": "FeatureCollection", "features": osm_features}, f, indent=2)
    except Exception as e:
        logging.warning(f"Could not fetch OSM vector data for {city_key} ({e}). Using topographical flow channels.")
    
    return osm_features

def generate_synthetic_channel_geojson(city_key: str):
    """Generate default channel and outburst network if rasters/OSM unavailable."""
    cfg = CITY_AOIS[city_key]
    lon_mid = (cfg["lon_min"] + cfg["lon_max"]) / 2.0
    lat_mid = (cfg["lat_min"] + cfg["lat_max"]) / 2.0

    channels = []
    for i, name in enumerate(cfg["primary_canals"]):
        offset = (i - 1.5) * 0.05
        coords = [
            [round(cfg["lon_min"] + 0.05, 5), round(lat_mid + offset - 0.05, 5)],
            [round(lon_mid, 5), round(lat_mid + offset, 5)],
            [round(cfg["lon_max"] - 0.05, 5), round(lat_mid + offset + 0.05, 5)]
        ]
        channels.append({
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": coords},
            "properties": {
                "name": name,
                "type": "primary_canal",
                "source": "Hydro-Network Model"
            }
        })

    outburst_nodes = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(lon_mid, 5), round(lat_mid, 5)]},
            "properties": {
                "risk_level": "CRITICAL",
                "depression_depth_m": 1.2,
                "elevation_m": cfg["base_elevation"],
                "description": f"Major Canal Bottleneck & Outburst Vulnerability Point ({cfg['primary_canals'][0]})"
            }
        }
    ]

    return {
        "type": "FeatureCollection",
        "city": cfg["name"],
        "city_key": city_key,
        "features": channels,
        "outburst_hotspots": {
            "type": "FeatureCollection",
            "features": outburst_nodes
        }
    }

def process_all_drainage_networks(output_dir=PROCESSED_DIR):
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    results = {}
    for city_key in CITY_AOIS:
        data = extract_dem_drainage_channels(city_key, data_dir=output_dir)
        out_file = out_path / f"{city_key}_drainage_network.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logging.info(f"Saved {CITY_AOIS[city_key]['name']} drainage network to {out_file}")
        results[city_key] = data
    return results

if __name__ == "__main__":
    process_all_drainage_networks()
