"""
SHAP Explainability Module for LiverGuard.
Provides local TreeSHAP attribution and human-readable clinical explanations.
"""

import json
import joblib
import numpy as np
import pandas as pd
import shap

NUMERIC_FEATURES = [
    "age",
    "total_bilirubin",
    "direct_bilirubin",
    "alkaline_phosphotase",
    "alamine_aminotransferase",
    "aspartate_aminotransferase",
    "total_protiens",
    "albumin",
    "albumin_and_globulin_ratio"
]
CATEGORICAL_FEATURES = ["gender"]

CLINICAL_INTERPRETATION_GUIDE = {
    "total_bilirubin": {
        "high": "Total Bilirubin is elevated above normal (0.1 - 1.2 mg/dL), indicating impaired hepatic clearance or biliary obstruction.",
        "normal": "Total Bilirubin is within normal range, indicating adequate bilirubin processing."
    },
    "direct_bilirubin": {
        "high": "Direct (conjugated) Bilirubin is elevated above normal (0.0 - 0.3 mg/dL), which is a sensitive indicator of cholestasis or hepatocellular injury.",
        "normal": "Direct Bilirubin is in the normal range."
    },
    "alkaline_phosphotase": {
        "high": "Alkaline Phosphatase (ALP) is elevated above normal (44 - 147 IU/L), suggesting biliary tract inflammation or obstruction.",
        "normal": "Alkaline Phosphatase is within normal limits."
    },
    "alamine_aminotransferase": {
        "high": "ALT (SGPT) is elevated above normal (7 - 56 IU/L), signifying acute or active hepatocellular membrane leakage.",
        "normal": "ALT is within normal physiological limits."
    },
    "aspartate_aminotransferase": {
        "high": "AST (SGOT) is elevated above normal (10 - 40 IU/L), which often reflects hepatocellular injury or mitochondrial damage.",
        "normal": "AST is within normal limits."
    },
    "total_protiens": {
        "low": "Total Serum Proteins are lower than normal (6.0 - 8.3 g/dL), reflecting diminished hepatic biosynthetic capacity.",
        "normal": "Total Serum Proteins are in the normal range."
    },
    "albumin": {
        "low": "Albumin is depressed below normal (3.5 - 5.0 g/dL), consistent with chronic hepatic insufficiency.",
        "normal": "Serum Albumin is adequate, reflecting preserved protein synthesis."
    },
    "albumin_and_globulin_ratio": {
        "low": "A/G Ratio is below the normal threshold (< 1.0), typical of cirrhosis, active hepatitis, or chronic liver disease.",
        "normal": "A/G Ratio is well-balanced."
    },
    "age": {
        "high": "Patient age increases susceptibility to cumulative metabolic and inflammatory liver insults.",
        "normal": "Patient age represents standard risk exposure."
    },
    "gender_Male": {
        "high": "Male sex has higher demographic prevalence in the ILPD cohort.",
        "normal": "Gender attribution baseline."
    }
}

class LiverGuardExplainer:
    def __init__(self, pipeline_path="models/liverguard_pipeline.joblib"):
        self.pipeline = joblib.load(pipeline_path)
        self.preprocessor = self.pipeline.named_steps["preprocessor"]
        self.classifier = self.pipeline.named_steps["classifier"]
        self.explainer = shap.TreeExplainer(self.classifier)

        cat_names = self.preprocessor.named_transformers_["cat"].named_steps["encoder"].get_feature_names_out(CATEGORICAL_FEATURES).tolist()
        self.feature_names = NUMERIC_FEATURES + cat_names

    def explain(self, input_df: pd.DataFrame):
        """
        Computes TreeSHAP explanations for an input DataFrame containing one patient record.
        """
        X_trans = self.preprocessor.transform(input_df)
        shap_vals = self.explainer.shap_values(X_trans)

        # Class 1 (Elevated Risk) SHAP values
        if isinstance(shap_vals, list):
            sv = shap_vals[1][0]
        elif len(shap_vals.shape) == 3:
            sv = shap_vals[0, :, 1]
        else:
            sv = shap_vals[0]

        expected_val = self.explainer.expected_value
        if isinstance(expected_val, (list, np.ndarray)):
            base_val = float(expected_val[1] if len(expected_val) > 1 else expected_val[0])
        else:
            base_val = float(expected_val)

        explanations = []
        for name, shap_contribution in zip(self.feature_names, sv):
            # Extract raw value
            raw_feature_key = name.replace("gender_Male", "gender")
            raw_val = input_df[raw_feature_key].values[0] if raw_feature_key in input_df else None
            
            direction = "increases_risk" if shap_contribution > 0 else "decreases_risk"
            impact_magnitude = abs(float(shap_contribution))
            
            # Clinical narrative
            clean_name = name.replace("gender_Male", "gender")
            guide = CLINICAL_INTERPRETATION_GUIDE.get(clean_name, {})
            if shap_contribution > 0:
                clinical_note = guide.get("high", f"{name} shifts prediction towards higher risk.")
            else:
                clinical_note = guide.get("normal", f"{name} is protective or aligns with lower risk.")

            explanations.append({
                "feature": clean_name,
                "display_name": clean_name.replace("_", " ").title(),
                "value": str(raw_val) if raw_val is not None else "",
                "shap_value": round(float(shap_contribution), 4),
                "impact": round(impact_magnitude, 4),
                "direction": direction,
                "clinical_note": clinical_note
            })

        # Sort by absolute SHAP impact
        explanations.sort(key=lambda x: x["impact"], reverse=True)
        return {
            "base_value": round(base_val, 4),
            "feature_contributions": explanations
        }

if __name__ == "__main__":
    test_patient = pd.DataFrame([{
        "age": 55,
        "gender": "Male",
        "total_bilirubin": 2.4,
        "direct_bilirubin": 1.1,
        "alkaline_phosphotase": 280,
        "alamine_aminotransferase": 75,
        "aspartate_aminotransferase": 90,
        "total_protiens": 5.9,
        "albumin": 2.7,
        "albumin_and_globulin_ratio": 0.8
    }])
    explainer = LiverGuardExplainer()
    res = explainer.explain(test_patient)
    print("Base Value:", res["base_value"])
    print("Top 3 Contributing Features:")
    for item in res["feature_contributions"][:3]:
        print(f" - {item['display_name']}: {item['shap_value']} ({item['direction']}) -> {item['clinical_note']}")
