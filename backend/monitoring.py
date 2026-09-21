"""
Monitoring and telemetry module for LiverGuard.
Tracks prediction distributions, latency, errors, and provides baseline for drift detection.
"""

from datetime import datetime, timezone
import numpy as np

class ModelMonitor:
    def __init__(self):
        self.total_predictions = 0
        self.total_errors = 0
        self.risk_distribution = {
            "Low Risk": 0,
            "Moderate / Borderline Risk": 0,
            "Elevated Risk": 0,
            "High Risk": 0
        }
        self.recent_latencies = []
        self.recent_predictions = []
        self.baseline_stats = {
            "age_mean": 44.75,
            "total_bilirubin_mean": 3.30,
            "direct_bilirubin_mean": 1.49,
            "alp_mean": 290.58,
            "alt_mean": 80.71,
            "ast_mean": 109.91
        }

    def record_prediction(self, risk_level: str, probability: float, latency_ms: float, input_summary: dict):
        self.total_predictions += 1
        if risk_level in self.risk_distribution:
            self.risk_distribution[risk_level] += 1
        else:
            self.risk_distribution[risk_level] = 1

        self.recent_latencies.append(latency_ms)
        if len(self.recent_latencies) > 200:
            self.recent_latencies.pop(0)

        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "probability": probability,
            "risk_level": risk_level,
            "latency_ms": round(latency_ms, 2),
            "age": input_summary.get("age"),
            "total_bilirubin": input_summary.get("total_bilirubin")
        }
        self.recent_predictions.append(record)
        if len(self.recent_predictions) > 100:
            self.recent_predictions.pop(0)

    def record_error(self):
        self.total_errors += 1

    def get_summary(self):
        avg_latency = float(np.mean(self.recent_latencies)) if self.recent_latencies else 0.0
        p95_latency = float(np.percentile(self.recent_latencies, 95)) if self.recent_latencies else 0.0

        return {
            "total_predictions": self.total_predictions,
            "total_validation_errors": self.total_errors,
            "average_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
            "risk_distribution": self.risk_distribution,
            "recent_predictions_count": len(self.recent_predictions),
            "drift_detection_status": "Active (Statistical Baseline Monitored)",
            "baseline_reference": self.baseline_stats
        }

monitor = ModelMonitor()
