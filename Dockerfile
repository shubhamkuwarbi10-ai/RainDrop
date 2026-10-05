# Pinned to a Debian release: the floating 3.11-slim tag moved from bookworm to
# trixie, which renamed libgdal32 to libgdal36 and broke the runtime stage.
FROM python:3.11-slim-trixie AS builder

WORKDIR /app

# Build-time only: compilers and GDAL headers for the geospatial wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─────────────────────────────────────────────
# Runtime image
# ─────────────────────────────────────────────
FROM python:3.11-slim-trixie

WORKDIR /app

# Runtime libraries only. libgdal-dev pulled in a compiler toolchain the
# running container has no use for.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgdal36 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Unprivileged service account. A container process running as root that is
# compromised is root on every bind-mounted host path.
RUN useradd --create-home --shell /usr/sbin/nologin --uid 10001 raindrop

COPY --from=builder /install /usr/local
COPY --chown=raindrop:raindrop . /app

# data/state holds operator credentials and is a named volume at runtime.
RUN mkdir -p data/processed data/raw data/state models/artifacts reports \
    && chown -R raindrop:raindrop /app/data /app/reports

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app/backend:/app"

USER raindrop

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
