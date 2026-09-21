"""
Pytest Suite for Backend REST API, Pydantic Validations, Authentication, and Health Checks.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["model_loaded"] is True
    assert data["database_connected"] is True

def test_model_info():
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert "decision_threshold" in data
    assert data["selected_architecture"] == "RandomForestClassifier"

def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "recall" in data
    assert "roc_auc" in data
    assert "confusion_matrix" in data
    assert "feature_importance" in data

def test_valid_prediction():
    payload = {
        "age": 52,
        "gender": "Male",
        "total_bilirubin": 2.1,
        "direct_bilirubin": 0.9,
        "alkaline_phosphotase": 240,
        "alamine_aminotransferase": 55,
        "aspartate_aminotransferase": 62,
        "total_protiens": 6.4,
        "albumin": 3.0,
        "albumin_and_globulin_ratio": 0.85
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "probability" in data
    assert "risk_level" in data
    assert "model_version" in data
    assert "disclaimer" in data
    assert "explanation" in data
    assert len(data["explanation"]) > 0
    # Mandatory medical safety check: Never claim to diagnose
    assert "not a medical diagnosis" in data["disclaimer"]
    assert "experimental machine-learning-based risk prediction" in data["disclaimer"]

def test_validation_impossible_age():
    payload = {
        "age": 150,  # Impossible age
        "gender": "Male",
        "total_bilirubin": 1.0,
        "direct_bilirubin": 0.3,
        "alkaline_phosphotase": 150,
        "alamine_aminotransferase": 30,
        "aspartate_aminotransferase": 30,
        "total_protiens": 7.0,
        "albumin": 3.5,
        "albumin_and_globulin_ratio": 1.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422

def test_validation_negative_value():
    payload = {
        "age": 45,
        "gender": "Male",
        "total_bilirubin": -1.5,  # Negative value
        "direct_bilirubin": 0.3,
        "alkaline_phosphotase": 150,
        "alamine_aminotransferase": 30,
        "aspartate_aminotransferase": 30,
        "total_protiens": 7.0,
        "albumin": 3.5,
        "albumin_and_globulin_ratio": 1.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422

def test_validation_unknown_gender():
    payload = {
        "age": 45,
        "gender": "UnknownCategory",
        "total_bilirubin": 1.0,
        "direct_bilirubin": 0.3,
        "alkaline_phosphotase": 150,
        "alamine_aminotransferase": 30,
        "aspartate_aminotransferase": 30,
        "total_protiens": 7.0,
        "albumin": 3.5,
        "albumin_and_globulin_ratio": 1.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422

def test_validation_direct_bilirubin_exceeding_total():
    payload = {
        "age": 45,
        "gender": "Male",
        "total_bilirubin": 1.0,
        "direct_bilirubin": 5.0,  # Clinically impossible
        "alkaline_phosphotase": 150,
        "alamine_aminotransferase": 30,
        "aspartate_aminotransferase": 30,
        "total_protiens": 7.0,
        "albumin": 3.5,
        "albumin_and_globulin_ratio": 1.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422

def test_auth_and_history_flow():
    import uuid
    random_email = f"clinician_{uuid.uuid4().hex[:8]}@hospital.org"
    register_payload = {
        "email": random_email,
        "password": "SecureClinicalPassword123!",
        "full_name": "Dr. Sarah Mitchell"
    }
    
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    assert token is not None

    # 2. Login
    login_payload = {
        "email": random_email,
        "password": "SecureClinicalPassword123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    
    # 3. Wrong password
    wrong_login = {
        "email": random_email,
        "password": "WrongPassword!"
    }
    wrong_res = client.post("/api/v1/auth/login", json=wrong_login)
    assert wrong_res.status_code == 401

    # 4. Predict with auth token
    pred_payload = {
        "age": 60,
        "gender": "Female",
        "total_bilirubin": 1.2,
        "direct_bilirubin": 0.4,
        "alkaline_phosphotase": 190,
        "alamine_aminotransferase": 28,
        "aspartate_aminotransferase": 32,
        "total_protiens": 6.9,
        "albumin": 3.4,
        "albumin_and_globulin_ratio": 0.95
    }
    pred_res = client.post(
        "/api/v1/predict",
        json=pred_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    prediction_id = pred_data["id"]

    # 5. Check history
    hist_res = client.get(
        "/api/v1/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["total"] >= 1

    # 6. Fetch single history record
    single_res = client.get(f"/api/v1/history/{prediction_id}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == prediction_id
