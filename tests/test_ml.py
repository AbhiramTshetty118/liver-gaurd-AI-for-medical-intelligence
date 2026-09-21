"""
Pytest Suite for ML Pipeline, Preprocessing, Model Loading, Probability Range, and SHAP Explainability.
"""

import os
import pytest
import numpy as np
import pandas as pd
import joblib

from ml.shap_explainer import LiverGuardExplainer

MODEL_PATH = "models/liverguard_pipeline.joblib"

@pytest.fixture(scope="module")
def pipeline():
    assert os.path.exists(MODEL_PATH), f"Model pipeline {MODEL_PATH} must exist."
    return joblib.load(MODEL_PATH)

@pytest.fixture(scope="module")
def explainer():
    return LiverGuardExplainer(MODEL_PATH)

def test_model_pipeline_loading(pipeline):
    """Verify that the full serialized pipeline loads cleanly with preprocessor and classifier."""
    assert pipeline is not None
    assert "preprocessor" in pipeline.named_steps
    assert "classifier" in pipeline.named_steps

def test_preprocessing_feature_order(pipeline):
    """Ensure that the ColumnTransformer strictly checks and accepts all required raw clinical columns."""
    sample_data = pd.DataFrame([{
        "age": 45,
        "gender": "Male",
        "total_bilirubin": 1.1,
        "direct_bilirubin": 0.3,
        "alkaline_phosphotase": 180,
        "alamine_aminotransferase": 32,
        "aspartate_aminotransferase": 35,
        "total_protiens": 6.8,
        "albumin": 3.4,
        "albumin_and_globulin_ratio": 1.0
    }])

    preprocessor = pipeline.named_steps["preprocessor"]
    transformed = preprocessor.transform(sample_data)
    # 9 numerical features + 1 one-hot encoded gender column = 10 features
    assert transformed.shape == (1, 10)
    assert not np.isnan(transformed).any()

def test_missing_value_imputation(pipeline):
    """Verify that missing values (e.g. missing A/G ratio in raw ILPD) are imputed without exception."""
    sample_with_nan = pd.DataFrame([{
        "age": 50,
        "gender": "Female",
        "total_bilirubin": 1.0,
        "direct_bilirubin": 0.2,
        "alkaline_phosphotase": 160,
        "alamine_aminotransferase": 25,
        "aspartate_aminotransferase": 28,
        "total_protiens": 7.0,
        "albumin": 3.5,
        "albumin_and_globulin_ratio": np.nan
    }])
    
    preprocessor = pipeline.named_steps["preprocessor"]
    transformed = preprocessor.transform(sample_with_nan)
    assert not np.isnan(transformed).any(), "Median imputation must replace NaN."

def test_probability_range(pipeline):
    """Ensure predicted probability outputs are valid probabilities bounded between 0.0 and 1.0."""
    sample_data = pd.DataFrame([{
        "age": 62,
        "gender": "Male",
        "total_bilirubin": 7.3,
        "direct_bilirubin": 4.1,
        "alkaline_phosphotase": 490,
        "alamine_aminotransferase": 60,
        "aspartate_aminotransferase": 68,
        "total_protiens": 7.0,
        "albumin": 3.3,
        "albumin_and_globulin_ratio": 0.89
    }])

    probs = pipeline.predict_proba(sample_data)[0]
    assert len(probs) == 2
    assert 0.0 <= probs[0] <= 1.0
    assert 0.0 <= probs[1] <= 1.0
    assert np.isclose(probs[0] + probs[1], 1.0, atol=1e-4)

def test_reproducibility(pipeline):
    """Verify deterministic outputs on identical test inputs."""
    sample = pd.DataFrame([{
        "age": 35,
        "gender": "Female",
        "total_bilirubin": 0.8,
        "direct_bilirubin": 0.2,
        "alkaline_phosphotase": 140,
        "alamine_aminotransferase": 20,
        "aspartate_aminotransferase": 22,
        "total_protiens": 7.2,
        "albumin": 3.8,
        "albumin_and_globulin_ratio": 1.1
    }])

    prob1 = pipeline.predict_proba(sample)[0, 1]
    prob2 = pipeline.predict_proba(sample)[0, 1]
    assert prob1 == prob2

def test_shap_explanation_integrity(explainer):
    """Verify TreeSHAP generates directional feature contributions, base value, and non-empty clinical text."""
    sample = pd.DataFrame([{
        "age": 58,
        "gender": "Male",
        "total_bilirubin": 4.5,
        "direct_bilirubin": 2.2,
        "alkaline_phosphotase": 310,
        "alamine_aminotransferase": 95,
        "aspartate_aminotransferase": 110,
        "total_protiens": 5.8,
        "albumin": 2.6,
        "albumin_and_globulin_ratio": 0.75
    }])

    result = explainer.explain(sample)
    assert "base_value" in result
    assert "feature_contributions" in result
    assert len(result["feature_contributions"]) == 10
    
    top_feature = result["feature_contributions"][0]
    assert "display_name" in top_feature
    assert "shap_value" in top_feature
    assert "direction" in top_feature
    assert top_feature["direction"] in ["increases_risk", "decreases_risk"]
    assert len(top_feature["clinical_note"]) > 10
