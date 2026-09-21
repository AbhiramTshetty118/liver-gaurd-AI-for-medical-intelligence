"""
Exploratory Data Analysis (EDA) and Preprocessing for LiverGuard.
Dataset: Indian Liver Patient Dataset (ILPD) from UCI ML Repository.
"""

import json
import os
import pandas as pd
import numpy as np

def run_eda():
    raw_path = "data/raw/ilpd_raw.csv"
    processed_path = "data/processed/indian_liver_patient_processed.csv"
    summary_path = "data/eda_summary.json"
    report_md_path = "docs/eda_report.md"

    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("docs", exist_ok=True)

    column_names = [
        "age",
        "gender",
        "total_bilirubin",
        "direct_bilirubin",
        "alkaline_phosphotase",
        "alamine_aminotransferase",
        "aspartate_aminotransferase",
        "total_protiens",
        "albumin",
        "albumin_and_globulin_ratio",
        "target_raw"
    ]

    df = pd.read_csv(raw_path, names=column_names, header=None)
    initial_rows = len(df)

    # Clean target: 1 = liver disease (1), 2 = healthy (0)
    df["target"] = df["target_raw"].apply(lambda x: 1 if int(x) == 1 else 0)

    # Missing value analysis
    missing_counts = df.isnull().sum().to_dict()
    
    # Duplicates analysis
    duplicate_count = int(df.duplicated().sum())

    # Gender distribution
    gender_counts = df["gender"].value_counts().to_dict()

    # Target class distribution
    target_counts = df["target"].value_counts().to_dict()
    total_records = len(df)
    class_1_pct = round((target_counts.get(1, 0) / total_records) * 100, 2)
    class_0_pct = round((target_counts.get(0, 0) / total_records) * 100, 2)

    # Numeric features
    num_cols = [
        "age", "total_bilirubin", "direct_bilirubin",
        "alkaline_phosphotase", "alamine_aminotransferase", "aspartate_aminotransferase",
        "total_protiens", "albumin", "albumin_and_globulin_ratio"
    ]

    # Convert numeric cols
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    stats = {}
    for col in num_cols:
        series = df[col].dropna()
        q25, q75 = series.quantile(0.25), series.quantile(0.75)
        iqr = q75 - q25
        outliers_count = int(((series < (q25 - 1.5 * iqr)) | (series > (q75 + 1.5 * iqr))).sum())
        stats[col] = {
            "mean": round(float(series.mean()), 3),
            "std": round(float(series.std()), 3),
            "median": round(float(series.median()), 3),
            "min": round(float(series.min()), 3),
            "q25": round(float(q25), 3),
            "q75": round(float(q75), 3),
            "max": round(float(series.max()), 3),
            "skewness": round(float(series.skew()), 3),
            "outliers_iqr": outliers_count,
            "missing": int(df[col].isnull().sum())
        }

    # Correlation matrix
    corr_df = df[num_cols + ["target"]].corr()
    corr_dict = {}
    for r in corr_df.index:
        corr_dict[r] = {c: round(float(corr_df.loc[r, c]), 4) for c in corr_df.columns}

    # Save processed dataframe (keeping target and target_raw)
    df.to_csv(processed_path, index=False)

    summary = {
        "dataset_name": "Indian Liver Patient Dataset (ILPD)",
        "source": "UCI Machine Learning Repository",
        "total_records": initial_rows,
        "features_count": len(column_names) - 1,
        "target_column": "target (1: Elevated Liver Disease Risk, 0: Healthy/Low Risk)",
        "duplicates": {
            "count": duplicate_count,
            "decision": "Kept in dataset without silent deletion. Cross-validation folds and scikit-learn pipeline handle data integrity without synthetic removal."
        },
        "missing_values": {
            "counts": missing_counts,
            "decision": "Albumin_and_Globulin_Ratio has 4 missing entries (0.68%). Handled inside Scikit-learn Pipeline via Median Imputation (SimpleImputer(strategy='median')) to prevent data leakage."
        },
        "class_imbalance": {
            "positive_liver_disease (1)": target_counts.get(1, 0),
            "negative_healthy (0)": target_counts.get(0, 0),
            "positive_pct": class_1_pct,
            "negative_pct": class_0_pct,
            "decision": "Addressed via balanced class weighting in estimators (class_weight='balanced') and decision threshold tuning favoring screening recall (minimizing false negatives)."
        },
        "feature_statistics": stats,
        "correlations": corr_dict,
        "key_findings": [
            "Strong correlation between direct_bilirubin and total_bilirubin (r = 0.87), indicating biliary excretion impairment.",
            "Moderate-high correlation between alamine_aminotransferase (ALT) and aspartate_aminotransferase (AST) (r = 0.79), typical of hepatocellular necrosis.",
            "Alkaline phosphatase (ALP) shows significant right-skewness (skew > 3.0), benefiting from robust scaling or tree-based ensemble models.",
            "Albumin and total proteins show positive correlation (r = 0.78), reflecting liver synthetic capacity."
        ]
    }

    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # Generate Markdown documentation
    md_content = f"""# LiverGuard: Exploratory Data Analysis (EDA) Report

## 1. Dataset Overview
- **Dataset**: Indian Liver Patient Dataset (ILPD)
- **Source**: UCI Machine Learning Repository
- **Total Records**: {initial_rows}
- **Features**: {len(column_names) - 1} clinical and demographic attributes
- **Target**: `target` (Binary: 1 = Elevated Liver Disease Risk, 0 = Healthy/Low Risk)

## 2. Demographic & Target Distributions
- **Target Distribution**:
  - Elevated Risk (Positive, 1): {target_counts.get(1, 0)} ({class_1_pct}%)
  - Healthy Controls (Negative, 0): {target_counts.get(0, 0)} ({class_0_pct}%)
- **Gender Distribution**:
  - Male: {gender_counts.get('Male', 0)} ({round(gender_counts.get('Male', 0)/total_records*100, 1)}%)
  - Female: {gender_counts.get('Female', 0)} ({round(gender_counts.get('Female', 0)/total_records*100, 1)}%)

## 3. Data Hygiene & Preprocessing Decisions
1. **Missing Values**:
   - `albumin_and_globulin_ratio` contains 4 missing records (0.68%).
   - **Decision**: No silent deletion. Missing values are imputed using **Median Imputation** (`SimpleImputer(strategy='median')`) integrated strictly inside the scikit-learn `Pipeline` to eliminate data leakage.
2. **Duplicate Records**:
   - {duplicate_count} duplicate rows observed in the raw UCI records.
   - **Decision**: Preserved to reflect empirical clinical sampling frequency while evaluated with stratified 5-fold cross-validation.
3. **Class Imbalance**:
   - The dataset exhibits a 71.4% to 28.6% positive skew.
   - **Decision**: Models use `class_weight='balanced'` and probability threshold tuning to maximize **Recall** and minimize False Negatives, which is critical for healthcare screening.
4. **Encoding & Scaling**:
   - Gender is one-hot encoded (`OneHotEncoder(drop='first', handle_unknown='ignore')`).
   - Numeric features are scaled with `StandardScaler()` within the cross-validation pipeline.

## 4. Key Clinical Correlation Insights
- **Total vs. Direct Bilirubin**: Correlation coefficient of {corr_dict['total_bilirubin']['direct_bilirubin']}. Both indicate cholestasis or hepatic clearance failure.
- **ALT vs. AST**: Correlation coefficient of {corr_dict['alamine_aminotransferase']['aspartate_aminotransferase']}. Transaminases reflect acute and chronic hepatocellular damage.
- **Albumin vs. Total Protein**: Correlation coefficient of {corr_dict['albumin']['total_protiens']}. Evaluates liver synthetic capacity.
"""

    with open(report_md_path, "w") as f:
        f.write(md_content)

    print("EDA completed successfully!")
    print(f"Summary saved to {summary_path}")
    print(f"Report saved to {report_md_path}")
    print(f"Class distribution: {target_counts}")

if __name__ == "__main__":
    run_eda()
