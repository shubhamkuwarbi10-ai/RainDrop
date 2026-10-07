# RainDrop GIS Cross-Device Setup & Launch Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   RainDrop GIS - Cross-Device Automated Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check for Docker
$hasDocker = Get-Command docker -ErrorAction SilentlyContinue
if ($hasDocker) {
    Write-Host "[✓] Docker detected." -ForegroundColor Green
    $dockerRunning = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Docker daemon is running." -ForegroundColor Green
        Write-Host "Launching multi-container production stack via Docker Compose..." -ForegroundColor Yellow
        docker compose up -d
        Write-Host ""
        Write-Host "RainDrop GIS is now live:" -ForegroundColor Green
        Write-Host "  - Frontend Dashboard: http://localhost (Port 80)" -ForegroundColor Cyan
        Write-Host "  - ML / GIS Server:    http://localhost:8000" -ForegroundColor Cyan
        Write-Host "  - Backend PostGIS:    http://localhost:8001" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "[!] Docker installed but daemon is not running. Falling back to native Python..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[!] Docker not detected. Proceeding with native Python environment..." -ForegroundColor Yellow
}

# 2. Check Python
$hasPython = Get-Command python -ErrorAction SilentlyContinue
if (-not $hasPython) {
    Write-Host "[X] Python 3.10+ is required. Please install Python from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# 3. Virtual Environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment in ./venv..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# 4. Install Dependencies
Write-Host "Installing Python dependencies from requirements.txt..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

# 5. Build/Verify Frontend Bundle
Write-Host "Building modular client bundle..." -ForegroundColor Yellow
python pipeline/transpile_frontend.py

Write-Host ""
Write-Host "[✓] Setup complete! Start the services with:" -ForegroundColor Green
Write-Host "    .\venv\Scripts\uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor Cyan
