# LiverGuard 🛡️
### Intelligent ML-Based System for Liver Disease Risk Screening & Explainability

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.7+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![SHAP](https://img.shields.io/badge/SHAP-TreeExplainer-red?style=flat)](https://github.com/slundberg/shap)
[![Tests](https://img.shields.io/badge/Tests-15%20Passed-brightgreen?style=flat)](./tests)

---

## ⚠️ Mandatory Medical & Research Disclaimer
> **LiverGuard is an experimental machine-learning application built strictly for research, educational, and decision-support evaluation.**  
> It does **not** provide a medical diagnosis, does not prescribe treatments, and must never replace clinical assessment, diagnostic imaging, or the professional judgment of a licensed healthcare provider.

---

## 1. Project Overview

Early detection of hepatic dysfunction significantly improves prognosis in conditions such as viral hepatitis, non-alcoholic fatty liver disease (NAFLD/NASH), and cirrhosis. However, routine Liver Function Tests (LFT) present complex non-linear interactions across enzymes, transaminases, and protein ratios.

**LiverGuard** is an end-to-end clinical machine learning system that:
1. Accepts 10 standard patient lab parameters (demographics and complete LFT panel).
2. Runs a serialized **Scikit-Learn Pipeline** trained on the **Indian Liver Patient Dataset (ILPD)** with zero data leakage.
3. Applies a **calibrated screening threshold (0.41)** specifically tuned to prioritize **recall (90.4% on hold-out test set)**, minimizing dangerous false negatives.
4. Computes exact mathematical local attributions via **TreeSHAP** to decompose each patient's risk into actionable biomarkers.
5. Provides an accessible, responsive, healthcare-grade React dashboard for clinical review, telemetry surveillance, and model auditability.

---

## 2. System Architecture

```
                                  +---------------------------------------+
                                  |         Unified HTTP Gateway          |
                                  |     (Express / Nginx reverse proxy)   |
                                  +-------------------+-------------------+
                                                      |
                          +---------------------------+---------------------------+
                          |                                                       |
                          v                                                       v
            +---------------------------+                           +---------------------------+
            |      React + Vite UI      |                           |    FastAPI Backend API    |
            |     (Tailwind CSS v4)     |                           |       (Python 3.10)       |
            |  - Patient Screener       |                           |  - /api/v1/predict        |
            |  - Recharts SHAP Waterfall|                           |  - /api/v1/metrics        |
            |  - Empirical ROC Curves   |                           |  - /api/v1/monitoring     |
            |  - Telemetry & Audits     |                           |  - Rate Limiting & Auth   |
            +---------------------------+                           +-------------+-------------+
                                                                                  |
                                              +-----------------------------------+-----------------------------------+
                                              |                                   |                                   |
                                              v                                   v                                   v
                                +---------------------------+       +---------------------------+       +---------------------------+
                                |  Trained Scikit Pipeline  |       |   TreeSHAP Explainer      |       |  PostgreSQL / SQLite DB   |
                                |  - ColumnTransformer      |       |   - Exact Shapley values  |       |  - Prediction audit log   |
                                |  - Median Imputation      |       |   - Clinical direction    |       |  - Latency telemetry      |
                                |  - Scaler + Random Forest |       |   - Explanatory notes     |       |  - Zero PHI stored        |
                                +---------------------------+       +---------------------------+       +---------------------------+
```

---

## 3. Machine Learning Methodology

### 3.1 Dataset & Hygiene
- **Dataset:** Indian Liver Patient Dataset (ILPD), UCI Machine Learning Repository (583 records).
- **Class Imbalance:** 416 liver disease patients (71.35%) vs. 167 healthy controls (28.65%).
- **Data Splitting:** Stratified 80% train / 20% test split performed **before** any transformations or scaling to prevent data leakage.
- **Missing Value Handling:** Albumin-and-Globulin ratio (A/G) has 4 missing values in ILPD. Handled via `SimpleImputer(strategy="median")` fit exclusively on the training fold.
- **Categorical Encoding:** Biological sex one-hot encoded via `OneHotEncoder(drop="first")`.

### 3.2 Model Comparison (5-Fold Cross-Validation)

| Algorithm | Mean CV ROC-AUC | Mean CV Recall | Mean CV Precision | Mean CV F1 |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest (Selected)** | **0.7630** | **0.8312** | **0.7580** | **0.7925** |
| Gradient Boosting | 0.7321 | 0.7854 | 0.7410 | 0.7620 |
| Logistic Regression (L2) | 0.7415 | 0.8120 | 0.7550 | 0.7820 |
| Support Vector Machine (RBF) | 0.7180 | 0.7440 | 0.7280 | 0.7350 |
| Decision Tree (Pruned) | 0.6840 | 0.7120 | 0.7050 | 0.7080 |

### 3.3 Clinical Threshold Calibration
Standard models default to a $0.50$ cutoff. In medical disease screening, a **False Negative** (discharging an undiagnosed patient) carries catastrophic risk compared to a **False Positive** (prompting a secondary ultrasound or repeat LFT).
- Calibrated Screening Threshold: **`0.41`**
- **Test Set Recall:** **`90.36%`** (75 of 83 liver disease patients correctly screened)
- **False Negative Rate:** Reduced to **`9.64%`** on unseen test records.

### 3.4 TreeSHAP Explainability
LiverGuard deploys Lundberg's `shap.TreeExplainer` on the tuned ensemble:
$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} [f_x(S \cup \{i\}) - f_x(S)]$$
Every prediction is accompanied by the exact relative positive or negative contribution of each biomarker alongside human-interpretable clinical notes.

---

## 4. REST API Specification

All routes are versioned under `/api/v1`. Interactive documentation is available at `/docs` (Swagger UI) and `/redoc`.

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health, model load state, DB connectivity | Public |
| `POST` | `/api/v1/predict` | Computes risk probability, classification & disclaimer | Public / Bearer |
| `POST` | `/api/v1/predict/explain` | Computes prediction + full TreeSHAP local attribution | Public / Bearer |
| `GET` | `/api/v1/metrics` | Real hold-out metrics, ROC points, confusion matrix | Public |
| `GET` | `/api/v1/model-info` | Hyperparameters, feature schema, library versions | Public |
| `GET` | `/api/v1/monitoring` | Request latency, p95, risk distribution, drift status | Public |
| `GET` | `/api/v1/history` | Anonymized audit trail of past screening requests | Bearer Optional |
| `POST` | `/api/v1/auth/register` | Register clinician account | Public |
| `POST` | `/api/v1/auth/login` | Login and receive JWT bearer token | Public |

---

## 5. Input Validation Rules

The API strictly rejects physiologically impossible or inconsistent inputs:
- `age`: Must be an integer between 1 and 120.
- `gender`: Must be `"Male"` or `"Female"`.
- All biomarker values must be strictly positive.
- `direct_bilirubin` cannot exceed `total_bilirubin` ($DB \le TB$).
- `albumin` cannot exceed `total_protiens` ($Albumin \le TotalProteins$).

---

## 6. Local Setup & Testing

### Prerequisites
- Python 3.10+
- Node.js 20+ & npm

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run ML training and export artifacts
python3 ml/train.py

# Run backend test suite (15 unit/integration tests)
PYTHONPATH=. pytest tests/ -v
```

### Unified Full-Stack Execution
```bash
# Install npm packages
npm install

# Start unified dev server (FastAPI on 8000 + React on 3000)
npm run dev
```

### Production Build & Linting
```bash
# Typecheck and lint codebase
npm run lint

# Compile frontend and backend bundles
npm run build
```

---

## 7. Docker Deployment

### With Docker Compose
Run the entire stack (PostgreSQL + FastAPI + Nginx React Frontend):
```bash
docker compose up --build -d
```
- Web Application: `http://localhost:3000`
- REST API Documentation: `http://localhost:8000/docs`

---

## 8. Privacy & Data Ethics
- **Zero Protected Health Information (PHI):** The database stores only calculated probabilities, risk categories, model versions, and timestamps. No names, IDs, addresses, or medical record numbers are persisted.
- **Audit Logging:** Every inference is tagged with a UUID audit identifier for reproducibility.
- **Fairness Surveillance:** Automated monitoring tracks drift against the baseline ILPD reference distribution.
