#!/usr/bin/env bash
# RainDrop GIS Cross-Device Setup & Launch Script (Linux / macOS / WSL)
set -e

echo "=========================================================="
echo "   RainDrop GIS - Cross-Device Automated Environment Setup"
echo "=========================================================="

# 1. Check for Docker
if command -v docker &> /dev/null; then
    echo "[✓] Docker detected."
    if docker info &> /dev/null; then
        echo "[✓] Docker daemon is running."
        echo "Launching multi-container production stack via Docker Compose..."
        docker compose up -d
        echo ""
        echo "RainDrop GIS is now live:"
        echo "  - Frontend Dashboard: http://localhost (Port 80)"
        echo "  - ML / GIS Server:    http://localhost:8000"
        echo "  - Backend PostGIS:    http://localhost:8001"
        exit 0
    else
        echo "[!] Docker installed but daemon is not running. Falling back to native Python..."
    fi
else
    echo "[!] Docker not detected. Proceeding with native Python environment..."
fi

# 2. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[X] Python 3.10+ is required. Please install Python 3."
    exit 1
fi

# 3. Virtual Environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment in ./venv..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

# 4. Install Dependencies
echo "Installing Python dependencies from requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Build/Verify Frontend Bundle
echo "Building modular client bundle..."
python3 pipeline/transpile_frontend.py

echo ""
echo "[✓] Setup complete! Start the services with:"
echo "    uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload"
