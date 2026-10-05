#!/usr/bin/env bash
# RainDrop GIS Cross-Device Setup & Launch Script (Linux / macOS / WSL)
set -e

echo "=========================================================="
echo "   RainDrop GIS - Cross-Device Automated Environment Setup"
echo "=========================================================="

# 0. Ensure .env exists, with real secrets.
# docker compose refuses to start when these are empty, which is deliberate:
# the old defaults shipped "postgres" as the database password to production.
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "[✓] Initialized .env from .env.example"

    if command -v openssl &> /dev/null; then
        for key in POSTGRES_PASSWORD RAINDROP_SESSION_SECRET RAINDROP_INGEST_KEY; do
            secret=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-40)
            # Only fill a key that is present and empty.
            sed -i.bak "s|^${key}=$|${key}=${secret}|" .env && rm -f .env.bak
        done
        db_password=$(grep "^POSTGRES_PASSWORD=" .env | cut -d= -f2-)
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=postgresql+psycopg2://raindrop:${db_password}@db:5432/raindrop|" .env && rm -f .env.bak
        echo "[✓] Generated secrets into .env. Keep this file out of version control."
    else
        echo "[!] openssl not found. Fill in POSTGRES_PASSWORD, RAINDROP_SESSION_SECRET"
        echo "    and RAINDROP_INGEST_KEY in .env before starting."
        exit 1
    fi
fi

# 0b. Top up an existing .env that predates the required secrets.
# A .env created from the old template has no RAINDROP_* keys, and docker
# compose refuses to start without them. The database password is never
# regenerated: the existing Postgres volume was initialised with it.
if [ -f ".env" ]; then
    for key in RAINDROP_SESSION_SECRET RAINDROP_INGEST_KEY; do
        if ! grep -q "^${key}=." .env; then
            if command -v openssl &> /dev/null; then
                secret=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-40)
            else
                secret=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
            fi
            sed -i.bak "/^${key}=$/d" .env && rm -f .env.bak
            printf '
%s=%s
' "$key" "$secret" >> .env
            echo "[✓] Added missing ${key} to .env"
        fi
    done
fi

# 1. Check for Docker
if command -v docker &> /dev/null; then
    echo "[✓] Docker detected."
    if docker info &> /dev/null; then
        echo "[✓] Docker daemon is running."
        echo "Launching multi-container production stack via Docker Compose..."
        docker compose up -d
        echo ""
        echo "RainDrop is now live:"
        echo "  - Everything is served through http://localhost"
        echo ""
        echo "The API and the database are reachable only on the Docker network."
        echo "Publishing them put the database on the internet and let clients"
        echo "bypass the rate limits in nginx."
        echo ""
        echo "Create a control-room operator before using the dashboard:"
        echo "  python backend/scripts/manage_operators.py add \\"
        echo "      --username chennai.ops --name \"GCC Control Room\" --cities chennai"
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

# 5. Build the stylesheet.
# Skipping this leaves client/tailwind.min.css stale, and a stale build silently
# drops every class added since it was generated.
if command -v npm &> /dev/null; then
    echo "Building Tailwind stylesheet..."
    npm install --silent
    npm run build:css
else
    echo "[!] npm not found. client/tailwind.min.css will not be rebuilt."
    echo "    Any class added since the last build will have no CSS."
fi

# 6. Build the client bundle.
echo "Building modular client bundle..."
python3 pipeline/transpile_frontend.py

echo ""
echo "[✓] Setup complete."
echo ""
echo "Start the backend:"
echo "    uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
echo ""
echo "Create a control-room operator:"
echo "    python backend/scripts/manage_operators.py add --username chennai.ops --cities chennai"
echo ""
echo "Run the tests:"
echo "    python -m pytest"
