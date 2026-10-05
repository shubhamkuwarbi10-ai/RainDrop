# RainDrop GIS Cross-Device Setup & Launch Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   RainDrop GIS - Cross-Device Automated Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Ensure .env exists, with real secrets.
# docker compose refuses to start when these are empty, which is deliberate:
# the old defaults shipped "postgres" as the database password to production.
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"

        function New-Secret {
            $bytes = New-Object byte[] 32
            [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
            return ([Convert]::ToBase64String($bytes) -replace "[=+/]", "").Substring(0, 40)
        }

        $dbPassword = New-Secret
        $content = Get-Content ".env" -Raw
        $content = $content -replace "(?m)^POSTGRES_PASSWORD=$", "POSTGRES_PASSWORD=$dbPassword"
        $content = $content -replace "(?m)^RAINDROP_SESSION_SECRET=$", "RAINDROP_SESSION_SECRET=$(New-Secret)"
        $content = $content -replace "(?m)^RAINDROP_INGEST_KEY=$", "RAINDROP_INGEST_KEY=$(New-Secret)"
        $content = $content -replace "(?m)^DATABASE_URL=.*$", "DATABASE_URL=postgresql+psycopg2://raindrop:$dbPassword@db:5432/raindrop"
        Set-Content ".env" $content -Encoding utf8 -NoNewline

        Write-Host "[✓] Initialized .env with generated secrets. Keep it out of version control." -ForegroundColor Green
    }
}

# 0b. Top up an existing .env that predates the required secrets.
# docker compose refuses to start without them. The database password is
# never regenerated: the existing Postgres volume was initialised with it.
if (Test-Path ".env") {
    $envText = Get-Content ".env" -Raw
    foreach ($key in @("RAINDROP_SESSION_SECRET", "RAINDROP_INGEST_KEY")) {
        if ($envText -notmatch "(?m)^$key=.+") {
            $bytes = New-Object byte[] 32
            [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
            $secret = ([Convert]::ToBase64String($bytes) -replace "[=+/]", "").Substring(0, 40)
            $envText = ($envText -replace "(?m)^$key=\s*$", "").TrimEnd() + "`n$key=$secret`n"
            Write-Host "[✓] Added missing $key to .env" -ForegroundColor Green
        }
    }
    Set-Content ".env" $envText -Encoding utf8 -NoNewline
}

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
        Write-Host "RainDrop is now live:" -ForegroundColor Green
        Write-Host "  - Everything is served through http://localhost" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "The API and the database are reachable only on the Docker network."
        Write-Host "Publishing them put the database on the internet and let clients"
        Write-Host "bypass the rate limits in nginx."
        Write-Host ""
        Write-Host "Create a control-room operator before using the dashboard:" -ForegroundColor Yellow
        Write-Host "  python backend/scripts/manage_operators.py add --username chennai.ops --cities chennai" -ForegroundColor Cyan
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
# Build the stylesheet. A stale client/tailwind.min.css silently drops every
# class added since it was last generated.
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "Building Tailwind stylesheet..." -ForegroundColor Yellow
    npm install --silent
    npm run build:css
} else {
    Write-Host "[!] npm not found. client/tailwind.min.css will not be rebuilt." -ForegroundColor Yellow
}

Write-Host "Building modular client bundle..." -ForegroundColor Yellow
python pipeline/transpile_frontend.py

Write-Host ""
Write-Host "[✓] Setup complete! Start the unified backend service with:" -ForegroundColor Green
Write-Host "    .\venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor Cyan
