import React from "react";
import { ShieldAlert, Cpu, Sparkles, CheckCircle, ArrowRight, FileText, Database, Lock } from "lucide-react";

interface LandingHeroProps {
  onStartScreener: () => void;
  onViewMetrics: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartScreener, onViewMetrics }) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Top Clinical Disclaimer Banner */}
        <div className="mb-8 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Mandatory Medical & Research Notice: </span>
            This system provides an experimental machine-learning-based risk prediction for educational and research
            purposes. It is strictly not a medical diagnosis and must not be used as a substitute for clinical evaluation
            by a qualified healthcare professional.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              Empirical ML Screening • ILPD Trained • TreeSHAP Explainable
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Early Detection & Explainable Liver Disease Risk Prediction
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              LiverGuard pairs routine liver function lab parameters (LFT) with a calibrated Random Forest classifier
              trained on the Indian Liver Patient Dataset. It delivers probability estimates, screening thresholds tuned
              to minimize false negatives, and individual SHAP feature contributions.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartScreener}
                className="px-5 py-3 rounded-lg bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors shadow-xs flex items-center gap-2"
              >
                Launch Risk Screener
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onViewMetrics}
                className="px-5 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-slate-500" />
                View Empirical Metrics & Curves
              </button>
            </div>

            {/* Trust points */}
            <div className="pt-4 flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>90.4% Screening Recall on Untouched Test Set</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>Local TreeSHAP Feature Attribution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-600" />
                <span>Zero Patient Identifiers Stored</span>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Steps Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                How LiverGuard Operates
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">Enter Standard LFT Lab Panel</h3>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Input Total/Direct Bilirubin, ALP, ALT, AST, Total Proteins, Albumin, and A/G Ratio with biological
                      validation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">Pipeline Preprocessing & Inference</h3>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Unified scikit-learn ColumnTransformer imputes and scales parameters with zero data leakage.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">SHAP Risk Decomposition</h3>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Outputs calm risk stratification alongside exact mathematical Shapley contributions for clinical
                      scrutiny.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50/50 rounded-lg p-3 text-[11px] text-teal-900 border border-teal-100 flex items-center justify-between">
                <span>Dataset: UCI ILPD (Indian Liver Patient Dataset)</span>
                <span className="font-medium">N = 583 records</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
