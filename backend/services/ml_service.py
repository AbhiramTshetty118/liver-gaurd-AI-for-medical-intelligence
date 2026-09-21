"""
ML Inference, SHAP Explanation, and Model Asset Management Service.
Loads the serialized pipeline and assets ONCE on startup.
"""

import json
import os
import joblib
import pandas as pd
from typing import Dict, Any, List
from ml.shap_explainer import LiverGuardExplainer
from backend.config import settings
from backend.schemas import PatientDataInput, FeatureContribution

DISCLAIMER_TEXT = (
    "This application provides an experimental machine-learning-based risk prediction for educational "
    "and research purposes. It is not a medical diagnosis and must not be used as a substitute for "
    "evaluation by a qualified healthcare professional."
)

class MLService:
    def __init__(self):
        self.pipeline = None
        self.explainer = None
        self.metadata = {}
        self.metrics = {}
        self.schema = {}
        self.curves = {}
        self.comparison = []
        self.eda_summary = {}
        self.loaded = False
        self._load_artifacts()

    def _load_artifacts(self):
        if not os.path.exists(settings.MODEL_PATH):
            print(f"Warning: Model file {settings.MODEL_PATH} not found.")
            return

        print(f"Loading trained pipeline from {settings.MODEL_PATH}...")
        self.pipeline = joblib.load(settings.MODEL_PATH)
        self.explainer = LiverGuardExplainer(settings.MODEL_PATH)

        if os.path.exists(settings.METADATA_PATH):
            with open(settings.METADATA_PATH, "r") as f:
                self.metadata = json.load(f)

        if os.path.exists(settings.METRICS_PATH):
            with open(settings.METRICS_PATH, "r") as f:
                self.metrics = json.load(f)

        if os.path.exists(settings.SCHEMA_PATH):
            with open(settings.SCHEMA_PATH, "r") as f:
                self.schema = json.load(f)

        if os.path.exists(settings.CURVES_PATH):
            with open(settings.CURVES_PATH, "r") as f:
                self.curves = json.load(f)

        if os.path.exists(settings.COMPARISON_PATH):
            with open(settings.COMPARISON_PATH, "r") as f:
                self.comparison = json.load(f)

        if os.path.exists(settings.EDA_SUMMARY_PATH):
            with open(settings.EDA_SUMMARY_PATH, "r") as f:
                self.eda_summary = json.load(f)

        self.loaded = True
        print(f"ML Service successfully initialized with model {self.metadata.get('model_name', 'Random Forest')}!")

    def predict(self, input_data: PatientDataInput) -> Dict[str, Any]:
        if not self.loaded or self.pipeline is None:
            raise RuntimeError("Model pipeline is not loaded. Ensure training script has executed.")

        patient_dict = {
            "age": input_data.age,
            "gender": input_data.gender,
            "total_bilirubin": input_data.total_bilirubin,
            "direct_bilirubin": input_data.direct_bilirubin,
            "alkaline_phosphotase": input_data.alkaline_phosphotase,
            "alamine_aminotransferase": input_data.alamine_aminotransferase,
            "aspartate_aminotransferase": input_data.aspartate_aminotransferase,
            "total_protiens": input_data.total_protiens,
            "albumin": input_data.albumin,
            "albumin_and_globulin_ratio": input_data.albumin_and_globulin_ratio
        }
        df = pd.DataFrame([patient_dict])

        # Predict probability for Class 1 (Elevated Risk)
        probabilities = self.pipeline.predict_proba(df)[0]
        prob_elevated = float(probabilities[1])

        # Threshold logic from clinical tuning
        threshold = float(self.metadata.get("decision_threshold", 0.41))
        prediction_binary = 1 if prob_elevated >= threshold else 0

        # Calm, clinically appropriate risk tiers
        if prob_elevated < 0.25:
            risk_level = "Low Risk"
        elif prob_elevated < threshold:
            risk_level = "Moderate / Borderline Risk"
        elif prob_elevated < 0.70:
            risk_level = "Elevated Risk"
        else:
            risk_level = "High Risk"

        # Compute TreeSHAP explanations
        shap_result = self.explainer.explain(df)
        feature_contributions = [
            FeatureContribution(**fc) for fc in shap_result["feature_contributions"]
        ]

        return {
            "prediction": prediction_binary,
            "probability": round(prob_elevated, 4),
            "risk_level": risk_level,
            "decision_threshold": threshold,
            "model_version": self.metadata.get("model_version", "v1.0.0"),
            "explanation": feature_contributions,
            "disclaimer": DISCLAIMER_TEXT,
            "input_summary": patient_dict
        }

    def get_model_info(self) -> Dict[str, Any]:
        return self.metadata

    def get_metrics(self) -> Dict[str, Any]:
        return {
            **self.metrics,
            "curves": self.curves,
            "comparison": self.comparison,
            "eda": self.eda_summary
        }

    def get_feature_schema(self) -> Dict[str, Any]:
        return self.schema

ml_service = MLService()
