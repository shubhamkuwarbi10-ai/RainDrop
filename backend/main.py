from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.flood import router as flood_router
from app.api.health import router as health_router
from app.api.ingestion import router as ingestion_router
from app.api.map import router as map_router
from app.api.ml_gis import router as ml_gis_router
from app.api.nowcast import router as nowcast_router
from app.api.processing import router as processing_router
from app.api.rainfall import router as rainfall_router
from app.api.surrogate import router as surrogate_router
from app.core import config
from app.core.paths import CLIENT_DIR, ensure_dirs
from app.core.security import operator_count
from app.db.session import initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_dirs()
    try:
        initialize_database()
        print("[ok] PostGIS database initialized.")
    except Exception as exc:  # noqa: BLE001 - the GIS/ML endpoints work without a database
        print(f"[!] Database unavailable ({exc.__class__.__name__}); serving read-only GIS and ML endpoints.")
    if operator_count() == 0:
        print(
            "[!] No operator accounts configured. The control room cannot be used until you run:\n"
            "    python backend/scripts/manage_operators.py add --username <name> --cities chennai mumbai delhi"
        )
    yield


app = FastAPI(
    title="RainDrop Urban Flood API",
    description=(
        "Rainfall nowcasting and flood-depth estimation for Indian cities. "
        "Every response carries a data_status field: live, heuristic, demo or unavailable."
    ),
    lifespan=lifespan,
    # The interactive docs list every write route and their schemas; keep them
    # off in production, where they are an invitation rather than a convenience.
    docs_url="/docs" if config.ENABLE_API_DOCS else None,
    redoc_url="/redoc" if config.ENABLE_API_DOCS else None,
    openapi_url="/openapi.json" if config.ENABLE_API_DOCS else None,
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Log the detail, return a generic message.

    Tracebacks and upstream error strings leak internal hostnames and absolute
    paths, which is how an attacker maps the deployment.
    """
    print(f"[!] Unhandled {exc.__class__.__name__}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


if CLIENT_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(CLIENT_DIR)), name="static")


@app.get("/")
def read_root():
    index_file = CLIENT_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "RainDrop Urban Flood API online"}


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(ml_gis_router)
app.include_router(rainfall_router)
app.include_router(flood_router)
app.include_router(ingestion_router)
app.include_router(map_router)
app.include_router(nowcast_router)
app.include_router(processing_router)
app.include_router(surrogate_router)
