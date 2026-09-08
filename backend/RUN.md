# RainDrop Backend Run Guide

## Start PostgreSQL/PostGIS

From `D:\Desktop\SIH\RainDrop`:

```powershell
docker compose up -d
```

## Start the backend

Open a new PowerShell terminal:

```powershell
cd D:\Desktop\SIH\RainDrop\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8001
```

Use these URLs:

- API docs: http://127.0.0.1:8001/docs
- Health: http://127.0.0.1:8001/health
- Database health: http://127.0.0.1:8001/health/db

## Stop services

Stop Uvicorn with `Ctrl+C`, then from the project root:

```powershell
docker compose down
```

## Current backend API groups

- `/health` and `/health/db`
- `/api/v1/rainfall` and `/api/v1/forecasts`
- `/api/v1/nowcast/ingest`
- `/api/v1/processing/*`
- `/api/v1/ingestion/*`
- `/api/v1/map/*`
- `/api/v1/flood-predictions` and `/api/v1/alerts`
