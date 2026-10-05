"""Runtime settings.

Secrets are read from the environment only. Nothing here carries a usable
default for a secret: a missing secret in production is a startup error, not a
silent fall back to "postgres"/"changeme".
"""
import os
import secrets
import sys

from dotenv import load_dotenv

load_dotenv()


def _flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


ENVIRONMENT = os.getenv("RAINDROP_ENV", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT in {"production", "prod"}

# FastAPI's interactive docs expose every write route; keep them off in prod.
ENABLE_API_DOCS = _flag("ENABLE_API_DOCS", default=not IS_PRODUCTION)

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    if IS_PRODUCTION:
        raise RuntimeError("DATABASE_URL must be set when RAINDROP_ENV=production")
    DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/raindrop"

# Shared secret for machine-to-machine ingest/processing calls.
INGEST_API_KEY = os.getenv("RAINDROP_INGEST_KEY", "")

# Key that signs operator session tokens.
SESSION_SECRET = os.getenv("RAINDROP_SESSION_SECRET", "")
SESSION_TTL_MINUTES = int(os.getenv("RAINDROP_SESSION_TTL_MINUTES", "480"))

if not SESSION_SECRET:
    if IS_PRODUCTION:
        raise RuntimeError("RAINDROP_SESSION_SECRET must be set when RAINDROP_ENV=production")
    # Ephemeral dev secret: sessions die with the process, which is the point.
    SESSION_SECRET = secrets.token_urlsafe(32)
    print("[!] RAINDROP_SESSION_SECRET unset - using a random dev secret; logins reset on restart.", file=sys.stderr)

if not INGEST_API_KEY and IS_PRODUCTION:
    raise RuntimeError("RAINDROP_INGEST_KEY must be set when RAINDROP_ENV=production")

# Cookies are only marked Secure where HTTPS actually terminates.
SESSION_COOKIE_SECURE = _flag("RAINDROP_SESSION_COOKIE_SECURE", default=IS_PRODUCTION)
SESSION_COOKIE_NAME = "raindrop_operator"

# Cities the project commits to supporting end to end.
FOCUS_CITIES = ("chennai", "mumbai", "delhi")

# Upstream weather provider.
OPEN_METEO_URL = os.getenv("OPEN_METEO_URL", "https://api.open-meteo.com/v1/forecast")
OPEN_METEO_TIMEZONE = os.getenv("OPEN_METEO_TIMEZONE", "Asia/Kolkata")
OPEN_METEO_CACHE_SECONDS = int(os.getenv("OPEN_METEO_CACHE_SECONDS", "300"))

# A reading older than this is stale, and the UI must say so.
DATA_STALE_AFTER_SECONDS = int(os.getenv("RAINDROP_STALE_AFTER_SECONDS", "600"))
