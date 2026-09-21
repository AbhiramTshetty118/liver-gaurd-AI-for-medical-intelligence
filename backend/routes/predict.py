"""
Prediction and SHAP explanation endpoints for LiverGuard.
"""

import time
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db, PredictionRecord, User
from backend.auth import get_current_user_optional
from backend.schemas import PatientDataInput, PredictionResponse
from backend.services.ml_service import ml_service
from backend.monitoring import monitor

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=PredictionResponse)
def predict_liver_risk(
    payload: PatientDataInput,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    try:
        result = ml_service.predict(payload)
        prediction_id = str(uuid.uuid4())
        result["id"] = prediction_id
        result["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        latency_ms = (time.time() - start_time) * 1000
        monitor.record_prediction(
            risk_level=result["risk_level"],
            probability=result["probability"],
            latency_ms=latency_ms,
            input_summary=result["input_summary"]
        )

        # Store prediction audit trail without unnecessary patient PII
        top_3_features = [
            {"feature": f.display_name, "impact": f.impact, "direction": f.direction}
            for f in result["explanation"][:3]
        ]
        
        record = PredictionRecord(
            id=prediction_id,
            user_id=current_user.id if current_user else None,
            model_version=result["model_version"],
            prediction=result["prediction"],
            probability=result["probability"],
            risk_level=result["risk_level"],
            top_features_summary=json.dumps(top_3_features),
            input_summary=json.dumps(result["input_summary"])
        )
        db.add(record)
        db.commit()

        return result
    except ValueError as ve:
        monitor.record_error()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        monitor.record_error()
        print(f"Error during prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while computing the prediction. Please verify input parameters."
        )

@router.post("/predict/explain", response_model=PredictionResponse)
def predict_and_explain(
    payload: PatientDataInput,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Predict and return full explanation
    return predict_liver_risk(payload, current_user, db)
