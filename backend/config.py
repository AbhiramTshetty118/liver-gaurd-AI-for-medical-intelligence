"""
Configuration settings for LiverGuard backend.
"""

import os

class Settings:
    PROJECT_NAME: str = "LiverGuard API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("JWT_SECRET", "liverguard_super_secure_jwt_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (PostgreSQL with automatic SQLite fallback)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./data/liverguard.db"
    )

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "*"
    ]

    # Model & Artifacts
    MODEL_PATH: str = "models/liverguard_pipeline.joblib"
    METADATA_PATH: str = "models/model_metadata.json"
    METRICS_PATH: str = "models/metrics.json"
    SCHEMA_PATH: str = "models/feature_schema.json"
    CURVES_PATH: str = "models/evaluation_curves.json"
    COMPARISON_PATH: str = "models/model_comparison.json"
    EDA_SUMMARY_PATH: str = "data/eda_summary.json"

settings = Settings()
