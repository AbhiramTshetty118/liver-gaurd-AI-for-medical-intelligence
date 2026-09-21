"""
Pydantic schemas with rigorous clinical validation and comprehensive error messaging.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator

class PatientDataInput(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Patient age in years (1 - 120)")
    gender: str = Field(..., description="Gender: 'Male' or 'Female'")
    total_bilirubin: float = Field(..., ge=0.1, le=100.0, description="Total Bilirubin in mg/dL (0.1 - 100.0)")
    direct_bilirubin: float = Field(..., ge=0.0, le=60.0, description="Direct Bilirubin in mg/dL (0.0 - 60.0)")
    alkaline_phosphotase: int = Field(..., ge=10, le=5000, description="Alkaline Phosphatase (ALP) in IU/L (10 - 5000)")
    alamine_aminotransferase: int = Field(..., ge=1, le=5000, description="Alanine Aminotransferase (ALT / SGPT) in IU/L (1 - 5000)")
    aspartate_aminotransferase: int = Field(..., ge=1, le=6000, description="Aspartate Aminotransferase (AST / SGOT) in IU/L (1 - 6000)")
    total_protiens: float = Field(..., ge=1.0, le=15.0, description="Total Serum Proteins in g/dL (1.0 - 15.0)")
    albumin: float = Field(..., ge=0.5, le=10.0, description="Serum Albumin in g/dL (0.5 - 10.0)")
    albumin_and_globulin_ratio: float = Field(..., ge=0.1, le=6.0, description="A/G Ratio (0.1 - 6.0)")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        clean = v.strip().capitalize()
        if clean not in ["Male", "Female"]:
            raise ValueError("Gender must be either 'Male' or 'Female'.")
        return clean

    @model_validator(mode="after")
    def validate_clinical_consistency(self) -> "PatientDataInput":
        # Direct bilirubin cannot exceed total bilirubin plus small analytical tolerance (0.3 mg/dL)
        if self.direct_bilirubin > (self.total_bilirubin + 0.3):
            raise ValueError(
                f"Direct Bilirubin ({self.direct_bilirubin} mg/dL) cannot significantly exceed Total Bilirubin ({self.total_bilirubin} mg/dL)."
            )
        # Albumin cannot exceed total proteins plus margin
        if self.albumin > (self.total_protiens + 0.2):
            raise ValueError(
                f"Serum Albumin ({self.albumin} g/dL) cannot exceed Total Serum Proteins ({self.total_protiens} g/dL)."
            )
        return self

class FeatureContribution(BaseModel):
    feature: str
    display_name: str
    value: str
    shap_value: float
    impact: float
    direction: str  # "increases_risk" or "decreases_risk"
    clinical_note: str

class PredictionResponse(BaseModel):
    id: Optional[str] = None
    prediction: int
    probability: float
    risk_level: str
    decision_threshold: float
    model_version: str
    timestamp: str
    explanation: List[FeatureContribution]
    disclaimer: str
    input_summary: Dict[str, Any]

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    training_date: str
    dataset: str
    features: List[str]
    raw_features_count: int
    selected_architecture: str
    hyperparameters: Dict[str, Any]
    decision_threshold: float
    default_threshold: float
    rationale_for_selection: str
    libraries: Dict[str, str]

class MetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    decision_threshold: float
    confusion_matrix: Dict[str, int]
    feature_importance: List[Dict[str, Any]]
    shap_summary: List[Dict[str, Any]]

class UserRegisterInput(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Clinical Investigator"

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v:
            raise ValueError("Please provide a valid email address.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v

class UserLoginInput(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class HistoryItemResponse(BaseModel):
    id: str
    timestamp: str
    model_version: str
    prediction: int
    probability: float
    risk_level: str
    input_summary: Optional[Dict[str, Any]] = None
    top_features: Optional[List[Dict[str, Any]]] = None

class HistoryListResponse(BaseModel):
    total: int
    items: List[HistoryItemResponse]

class HealthResponse(BaseModel):
    status: str
    version: str
    model_loaded: bool
    database_connected: bool
    timestamp: str
