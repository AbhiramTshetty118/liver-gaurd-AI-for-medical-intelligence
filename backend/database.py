"""
Database connection, session management, and models for LiverGuard.
Supports PostgreSQL with local SQLite automatic fallback.
Stores minimal audit metadata without unnecessary patient identifiable details.
"""

import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.config import settings

db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    os.makedirs("data", exist_ok=True)

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    predictions = relationship("PredictionRecord", back_populates="user")

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    model_version = Column(String(50), nullable=False)
    prediction = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    top_features_summary = Column(Text, nullable=True)
    input_summary = Column(Text, nullable=True)  # Anonymized laboratory metrics

    user = relationship("User", back_populates="predictions")

class MonitoringAuditLog(Base):
    __tablename__ = "monitoring_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    endpoint = Column(String(100), nullable=False)
    latency_ms = Column(Float, nullable=False)
    status_code = Column(Integer, nullable=False)
    model_version = Column(String(50), nullable=True)
    prediction = Column(Integer, nullable=True)
    probability = Column(Float, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

# Auto-initialize tables
try:
    init_db()
except Exception as e:
    print("Database initialization notice:", e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
