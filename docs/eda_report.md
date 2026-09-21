# LiverGuard: Exploratory Data Analysis (EDA) Report

## 1. Dataset Overview
- **Dataset**: Indian Liver Patient Dataset (ILPD)
- **Source**: UCI Machine Learning Repository
- **Total Records**: 583
- **Features**: 10 clinical and demographic attributes
- **Target**: `target` (Binary: 1 = Elevated Liver Disease Risk, 0 = Healthy/Low Risk)

## 2. Demographic & Target Distributions
- **Target Distribution**:
  - Elevated Risk (Positive, 1): 416 (71.36%)
  - Healthy Controls (Negative, 0): 167 (28.64%)
- **Gender Distribution**:
  - Male: 441 (75.6%)
  - Female: 142 (24.4%)

## 3. Data Hygiene & Preprocessing Decisions
1. **Missing Values**:
   - `albumin_and_globulin_ratio` contains 4 missing records (0.68%).
   - **Decision**: No silent deletion. Missing values are imputed using **Median Imputation** (`SimpleImputer(strategy='median')`) integrated strictly inside the scikit-learn `Pipeline` to eliminate data leakage.
2. **Duplicate Records**:
   - 13 duplicate rows observed in the raw UCI records.
   - **Decision**: Preserved to reflect empirical clinical sampling frequency while evaluated with stratified 5-fold cross-validation.
3. **Class Imbalance**:
   - The dataset exhibits a 71.4% to 28.6% positive skew.
   - **Decision**: Models use `class_weight='balanced'` and probability threshold tuning to maximize **Recall** and minimize False Negatives, which is critical for healthcare screening.
4. **Encoding & Scaling**:
   - Gender is one-hot encoded (`OneHotEncoder(drop='first', handle_unknown='ignore')`).
   - Numeric features are scaled with `StandardScaler()` within the cross-validation pipeline.

## 4. Key Clinical Correlation Insights
- **Total vs. Direct Bilirubin**: Correlation coefficient of 0.8746. Both indicate cholestasis or hepatic clearance failure.
- **ALT vs. AST**: Correlation coefficient of 0.792. Transaminases reflect acute and chronic hepatocellular damage.
- **Albumin vs. Total Protein**: Correlation coefficient of 0.7841. Evaluates liver synthetic capacity.
