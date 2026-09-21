export interface PatientInput {
  age: number;
  gender: "Male" | "Female";
  total_bilirubin: number;
  direct_bilirubin: number;
  alkaline_phosphotase: number;
  alamine_aminotransferase: number;
  aspartate_aminotransferase: number;
  total_protiens: number;
  albumin: number;
  albumin_and_globulin_ratio: number;
}

export interface FeatureContribution {
  feature: string;
  display_name: string;
  value: string;
  shap_value: number;
  impact: number;
  direction: "increases_risk" | "decreases_risk";
  clinical_note: string;
}

export interface PredictionResult {
  id: string;
  prediction: number;
  probability: number;
  risk_level: "Low Risk" | "Moderate / Borderline Risk" | "Elevated Risk" | "High Risk";
  decision_threshold: number;
  model_version: string;
  timestamp: string;
  explanation: FeatureContribution[];
  disclaimer: string;
  input_summary: PatientInput;
}

export interface ModelMetadata {
  model_name: string;
  model_version: string;
  training_date: string;
  dataset: string;
  features: string[];
  raw_features_count: number;
  total_train_samples?: number;
  total_test_samples?: number;
  selected_architecture: string;
  hyperparameters: Record<string, any>;
  decision_threshold: number;
  default_threshold: number;
  rationale_for_selection: string;
  libraries: Record<string, string>;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  decision_threshold: number;
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
    total_evaluated: number;
  };
  feature_importance: Array<{
    feature: string;
    importance: number;
  }>;
  shap_summary: Array<{
    feature: string;
    mean_abs_shap: number;
  }>;
  curves?: {
    roc_curve: Array<{ fpr: number; tpr: number; threshold: number }>;
    pr_curve: Array<{ recall: number; precision: number }>;
    calibration_curve: Array<{ prob_pred: number; prob_true: number }>;
  };
  comparison?: Array<{
    model: string;
    cv_accuracy_mean: number;
    cv_recall_mean: number;
    cv_precision_mean: number;
    cv_f1_mean: number;
    cv_roc_auc_mean: number;
    cv_roc_auc_std: number;
  }>;
  eda?: Record<string, any>;
}

export interface MonitoringTelemetry {
  total_predictions: number;
  total_validation_errors: number;
  average_latency_ms: number;
  p95_latency_ms: number;
  risk_distribution: Record<string, number>;
  recent_predictions_count: number;
  drift_detection_status: string;
  baseline_reference: Record<string, number>;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  model_version: string;
  prediction: number;
  probability: number;
  risk_level: string;
  input_summary?: PatientInput;
  top_features?: Array<{
    feature: string;
    impact: number;
    direction: string;
  }>;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
}
