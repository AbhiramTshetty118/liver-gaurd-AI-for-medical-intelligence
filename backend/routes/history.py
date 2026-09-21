"""
Prediction history endpoints.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import get_db, PredictionRecord, User
from backend.auth import get_current_user_optional
from backend.schemas import HistoryListResponse, HistoryItemResponse

router = APIRouter(prefix="/history", tags=["Prediction History"])

@router.get("", response_model=HistoryListResponse)
def get_prediction_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)
    if current_user:
        query = query.filter(PredictionRecord.user_id == current_user.id)
    
    records = query.order_by(desc(PredictionRecord.timestamp)).limit(limit).all()
    
    items = []
    for r in records:
        inp = json.loads(r.input_summary) if r.input_summary else None
        top_f = json.loads(r.top_features_summary) if r.top_features_summary else None
        items.append(HistoryItemResponse(
            id=r.id,
            timestamp=r.timestamp.isoformat() if r.timestamp else "",
            model_version=r.model_version,
            prediction=r.prediction,
            probability=r.probability,
            risk_level=r.risk_level,
            input_summary=inp,
            top_features=top_f
        ))

    return HistoryListResponse(total=len(items), items=items)

@router.get("/{prediction_id}", response_model=HistoryItemResponse)
def get_single_prediction_history(
    prediction_id: str,
    db: Session = Depends(get_db)
):
    r = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID '{prediction_id}' not found."
        )

    inp = json.loads(r.input_summary) if r.input_summary else None
    top_f = json.loads(r.top_features_summary) if r.top_features_summary else None

    return HistoryItemResponse(
        id=r.id,
        timestamp=r.timestamp.isoformat() if r.timestamp else "",
        model_version=r.model_version,
        prediction=r.prediction,
        probability=r.probability,
        risk_level=r.risk_level,
        input_summary=inp,
        top_features=top_f
    )
