"""
AquaSight RainDrop - Unified Server Entrypoint
Provides 100% backward-compatible proxy to backend.main:app.
All ML, GIS, Terrain, Wards, Telemetry, and PostGIS endpoints
are now consolidated in backend.app.
"""
import sys
from pathlib import Path

# Ensure backend directory is in python search path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
