from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.flood import router as flood_router
from app.api.health import router as health_router
from app.api.rainfall import router as rainfall_router
from app.db.session import initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="RainDrop API", lifespan=lifespan)
app.include_router(health_router)
app.include_router(rainfall_router)
app.include_router(flood_router)