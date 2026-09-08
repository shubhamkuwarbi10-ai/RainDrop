import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

app = FastAPI(title="AquaSight RainDrop API")

# Mount the client directory to serve static files
client_dir = Path(__file__).parent.parent / "client"
app.mount("/static", StaticFiles(directory=str(client_dir)), name="static")

# The path to the forecast TIF file
FORECAST_FILE = Path(__file__).parent.parent / "data" / "processed" / "pysteps_forecast.tif"

WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

def fetch_open_meteo_weather(lat: float, lon: float):
    """Fetch current weather and 24h hourly precipitation forecast from Open-Meteo API."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m"
        f"&hourly=precipitation,rain"
        f"&forecast_days=1"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "RainDrop/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                
                weather_code = current.get("weather_code", 0)
                weather_desc = WMO_WEATHER_CODES.get(weather_code, "Unknown")
                
                hourly_precip = hourly.get("precipitation", [])
                hourly_times = [t.split("T")[-1] for t in hourly.get("time", [])]
                
                return {
                    "success": True,
                    "current": {
                        "temperature_c": current.get("temperature_2m"),
                        "humidity_pct": current.get("relative_humidity_2m"),
                        "precipitation_mm": current.get("precipitation"),
                        "wind_speed_kmh": current.get("wind_speed_10m"),
                        "weather_code": weather_code,
                        "weather_description": weather_desc
                    },
                    "hourly_precip": hourly_precip,
                    "hourly_times": hourly_times
                }
    except Exception as e:
        print(f"Open-Meteo API fetch error: {e}")
    
    return {"success": False}

@app.get("/")
def read_root():
    return FileResponse(client_dir / "index.html")

@app.get("/api/predict")
def predict_rainfall(lat: float = Query(...), lon: float = Query(...)):
    """Predict rainfall for a given latitude and longitude using Open-Meteo & PySTEPS local radar if available."""
    open_meteo_res = fetch_open_meteo_weather(lat, lon)
    
    timeseries = []
    timeseries_labels = []
    source = "Open-Meteo Live API"
    
    # Try reading from local PySTEPS TIF raster if available and location is inside bounds
    pysteps_used = False
    if HAS_RASTERIO and FORECAST_FILE.exists():
        try:
            with rasterio.open(FORECAST_FILE) as src:
                bounds = src.bounds
                if bounds.bottom <= lat <= bounds.top and bounds.left <= lon <= bounds.right:
                    row, col = src.index(lon, lat)
                    window = rasterio.windows.Window(col, row, 1, 1)
                    data = src.read(window=window)
                    timeseries = [round(float(val), 2) for val in data[:, 0, 0]]
                    timeseries_labels = [f"+{i*5} min" for i in range(len(timeseries))]
                    source = "PySTEPS Radar Nowcast + Open-Meteo"
                    pysteps_used = True
        except Exception as e:
            print(f"Error reading raster: {e}")
            
    if not pysteps_used:
        if open_meteo_res.get("success"):
            timeseries = [round(float(val), 2) for val in open_meteo_res.get("hourly_precip", [])[:12]]
            timeseries_labels = open_meteo_res.get("hourly_times", [])[:12]
        else:
            timeseries = [0.0] * 12
            timeseries_labels = [f"+{i*5} min" for i in range(12)]
            source = "Fallback (API Unavailable)"
            
    total_rainfall = round(sum(timeseries), 2)
    peak_intensity = max(timeseries) if timeseries else 0.0
    
    if peak_intensity > 25.0 or total_rainfall > 50.0:
        risk_level = "SEVERE"
    elif peak_intensity > 10.0 or total_rainfall > 20.0:
        risk_level = "HIGH"
    elif peak_intensity > 2.5 or total_rainfall > 5.0:
        risk_level = "MODERATE"
    elif peak_intensity > 0.1:
        risk_level = "LOW"
    else:
        risk_level = "NONE"
        
    rain_predicted = total_rainfall > 0.1 or (open_meteo_res.get("current", {}).get("precipitation_mm", 0) or 0) > 0.1
    
    return {
        "location": {"lat": lat, "lon": lon},
        "source": source,
        "current_weather": open_meteo_res.get("current") if open_meteo_res.get("success") else None,
        "forecast": {
            "rain_predicted": rain_predicted,
            "total_rainfall_mm": total_rainfall,
            "peak_intensity_mm_hr": peak_intensity,
            "risk_level": risk_level,
            "timeseries_mm_hr": timeseries,
            "timeseries_labels": timeseries_labels
        }
    }

