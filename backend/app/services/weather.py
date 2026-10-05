"""Open-Meteo client.

Three things this module exists to get right, each of which was wrong before:

1. **Time window.** The previous code took `hourly[:12]`, which is the first 12
   hours of the *calendar day* in UTC. At 18:00 IST that is a forecast for a
   window that already finished. We request `timezone=Asia/Kolkata` and slice
   from the current local hour forward.

2. **Units.** Open-Meteo's hourly `precipitation` is the millimetre *total for
   the preceding hour*. Summing it gives a depth in mm, and the maximum of the
   series is a rate in mm/hr only because the accumulation period is one hour.
   The two are kept in separately named fields so nothing downstream can add
   rates together and call the result a depth.

3. **Caching.** One upstream call per rounded coordinate per cache window,
   rather than one per browser poll per user.
"""
from __future__ import annotations

import json
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.core import config

WMO_WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

# Grid the cache to ~1 km so nearby wards share one upstream call.
_CACHE_PRECISION = 2
_cache: dict[tuple[float, float], tuple[float, "WeatherReading"]] = {}
_cache_lock = threading.Lock()


@dataclass
class WeatherReading:
    """One Open-Meteo response, normalised."""

    ok: bool
    #: Model time of the current conditions, as reported upstream (local time).
    observed_at: str | None = None
    current: dict[str, Any] | None = None
    #: Per-hour rainfall totals in mm, starting at the current local hour.
    hourly_precip_mm: list[float] = field(default_factory=list)
    #: Local "HH:MM" label for the hour each value accumulates into.
    hourly_labels: list[str] = field(default_factory=list)
    error: str | None = None

    @property
    def total_rainfall_mm(self) -> float:
        """Depth over the returned window. Hourly totals, so a plain sum."""
        return round(sum(self.hourly_precip_mm), 2)

    @property
    def peak_intensity_mm_hr(self) -> float:
        """Largest single-hour total, which is a rate because the period is 1 h."""
        return round(max(self.hourly_precip_mm), 2) if self.hourly_precip_mm else 0.0


def _slice_from_now(times: list[str], values: list[float], hours: int) -> tuple[list[str], list[float]]:
    """Return the next `hours` entries starting at the current local hour."""
    now_hour = datetime.now().strftime("%Y-%m-%dT%H:00")
    start = 0
    for index, stamp in enumerate(times):
        if stamp >= now_hour:
            start = index
            break
    else:
        start = max(0, len(times) - hours)
    return times[start:start + hours], values[start:start + hours]


def _fetch(lat: float, lon: float, hours: int) -> WeatherReading:
    query = urllib.parse.urlencode({
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        "hourly": "precipitation",
        "timezone": config.OPEN_METEO_TIMEZONE,
        "forecast_days": 2,
    })
    request = urllib.request.Request(
        f"{config.OPEN_METEO_URL}?{query}",
        headers={"User-Agent": "RainDrop/1.0", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            if response.status != 200:
                return WeatherReading(ok=False, error=f"upstream returned HTTP {response.status}")
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        # The class name is enough for the client; the detail stays in the log.
        print(f"[!] Open-Meteo fetch failed: {exc.__class__.__name__}: {exc}")
        return WeatherReading(ok=False, error=exc.__class__.__name__)

    current = payload.get("current", {}) or {}
    hourly = payload.get("hourly", {}) or {}
    times = [str(stamp) for stamp in hourly.get("time", [])]
    values = [float(value or 0.0) for value in hourly.get("precipitation", [])]
    window_times, window_values = _slice_from_now(times, values, hours)

    code = current.get("weather_code", 0)
    return WeatherReading(
        ok=True,
        observed_at=current.get("time"),
        current={
            "temperature_c": current.get("temperature_2m"),
            "humidity_pct": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "weather_code": code,
            "weather_description": WMO_WEATHER_CODES.get(code, "Unknown"),
        },
        hourly_precip_mm=[round(value, 2) for value in window_values],
        hourly_labels=[stamp.split("T")[-1] for stamp in window_times],
    )


def get_weather(lat: float, lon: float, hours: int = 12) -> WeatherReading:
    """Cached Open-Meteo lookup for a coordinate."""
    key = (round(lat, _CACHE_PRECISION), round(lon, _CACHE_PRECISION))
    now = time.monotonic()

    with _cache_lock:
        cached = _cache.get(key)
        if cached and now - cached[0] < config.OPEN_METEO_CACHE_SECONDS:
            return cached[1]

    reading = _fetch(lat, lon, hours)

    with _cache_lock:
        # Never cache a failure: the next poll should retry.
        if reading.ok:
            _cache[key] = (now, reading)
    return reading


def clear_cache() -> None:
    """Test hook."""
    with _cache_lock:
        _cache.clear()
