# Multi-stage Python Backend Dockerfile for LiverGuard API
# Stage 1: Build & Dependencies
FROM python:3.10-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime Production Image
FROM python:3.10-slim

WORKDIR /app

# Create non-root system user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Install curl for container healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed wheels from builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy backend, models, ml, and data directories
COPY --chown=appuser:appgroup backend/ ./backend/
COPY --chown=appuser:appgroup models/ ./models/
COPY --chown=appuser:appgroup ml/ ./ml/
COPY --chown=appuser:appgroup data/ ./data/

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
