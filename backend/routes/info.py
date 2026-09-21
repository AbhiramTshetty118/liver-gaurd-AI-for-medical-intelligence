"""
Health, Model Information, Metrics, and Schema endpoints.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.services.ml_service import ml_service
from backend.monitoring import monitor
from backend.schemas import HealthResponse

router = APIRouter(tags=["Model Information & Health"])

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if (ml_service.loaded and db_connected) else "degraded",
        "version": "1.0.0",
        "model_loaded": ml_service.loaded,
        "database_connected": db_connected,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/model-info")
def get_model_info():
    return ml_service.get_model_info()

@router.get("/metrics")
def get_metrics():
    return ml_service.get_metrics()

@router.get("/schema")
def get_feature_schema():
    return ml_service.get_feature_schema()

@router.get("/monitoring")
def get_monitoring_telemetry():
    return monitor.get_summary()
