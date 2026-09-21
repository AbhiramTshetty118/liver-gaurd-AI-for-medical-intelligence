import React, { useState } from "react";
import { Info, AlertCircle, ArrowRight, RefreshCw, Sparkles, Check, HeartPulse, User } from "lucide-react";
import { PatientInput } from "../types";

interface PredictionFormProps {
  onSubmit: (data: PatientInput) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  validationErrors?: string[];
}

const CLINICAL_PRESETS: Record<string, { label: string; description: string; data: PatientInput }> = {
  healthy: {
    label: "Normal / Healthy Baseline",
    description: "Parameters within standard reference ranges.",
    data: {
      age: 38,
      gender: "Female",
      total_bilirubin: 0.8,
      direct_bilirubin: 0.2,
      alkaline_phosphotase: 160,
      alamine_aminotransferase: 22,
      aspartate_aminotransferase: 24,
      total_protiens: 7.2,
      albumin: 3.8,
      albumin_and_globulin_ratio: 1.15
    }
  },
  hepatitis: {
    label: "Hepatocellular Pattern (Elevated Transaminases)",
    description: "Markedly elevated ALT/AST indicating active hepatocellular stress.",
    data: {
      age: 48,
      gender: "Male",
      total_bilirubin: 2.3,
      direct_bilirubin: 1.0,
      alkaline_phosphotase: 230,
      alamine_aminotransferase: 145,
      aspartate_aminotransferase: 180,
      total_protiens: 6.8,
      albumin: 3.2,
      albumin_and_globulin_ratio: 0.88
    }
  },
  cholestatic: {
    label: "Cholestatic Pattern (Biliary Stasis)",
    description: "Elevated Bilirubin and Alkaline Phosphatase indicative of biliary pathology.",
    data: {
      age: 62,
      gender: "Male",
      total_bilirubin: 5.4,
      direct_bilirubin: 2.8,
      alkaline_phosphotase: 490,
      alamine_aminotransferase: 45,
      aspartate_aminotransferase: 52,
      total_protiens: 6.9,
      albumin: 3.1,
      albumin_and_globulin_ratio: 0.81
    }
  },
  chronic: {
    label: "Chronic Impairment (Diminished Albumin & A/G)",
    description: "Depressed albumin synthesis and inverted A/G ratio.",
    data: {
      age: 56,
      gender: "Male",
      total_bilirubin: 3.1,
      direct_bilirubin: 1.4,
      alkaline_phosphotase: 280,
      alamine_aminotransferase: 62,
      aspartate_aminotransferase: 88,
      total_protiens: 5.5,
      albumin: 2.3,
      albumin_and_globulin_ratio: 0.72
    }
  }
};

export const PredictionForm: React.FC<PredictionFormProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
  validationErrors
}) => {
  const [formData, setFormData] = useState<PatientInput>({
    age: 45,
    gender: "Male",
    total_bilirubin: 1.2,
    direct_bilirubin: 0.4,
    alkaline_phosphotase: 200,
    alamine_aminotransferase: 35,
    aspartate_aminotransferase: 40,
    total_protiens: 6.8,
    albumin: 3.2,
    albumin_and_globulin_ratio: 0.95
  });

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const applyPreset = (key: keyof typeof CLINICAL_PRESETS) => {
    setFormData(CLINICAL_PRESETS[key].data);
    setLocalError(null);
  };

  const handleInputChange = (field: keyof PatientInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "gender" ? value : Number(value)
    }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Client-side biological sanity checks
    if (formData.direct_bilirubin > formData.total_bilirubin + 0.3) {
      setLocalError(
        `Direct Bilirubin (${formData.direct_bilirubin} mg/dL) cannot exceed Total Bilirubin (${formData.total_bilirubin} mg/dL).`
      );
      return;
    }
    if (formData.albumin > formData.total_protiens + 0.2) {
      setLocalError(
        `Serum Albumin (${formData.albumin} g/dL) cannot exceed Total Serum Proteins (${formData.total_protiens} g/dL).`
      );
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-700" />
              Liver Function Lab Parameters Entry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter patient demographics and standard clinical liver function tests (LFT) for ML assessment.
            </p>
          </div>

          {/* Quick clinical presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Sample Profiles:</span>
            {Object.entries(CLINICAL_PRESETS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 transition-colors"
                title={item.description}
              >
                {item.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Error alerts */}
        {(errorMessage || localError || (validationErrors && validationErrors.length > 0)) && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Input Validation Error</span>
            </div>
            {localError && <p className="text-xs text-rose-800">{localError}</p>}
            {errorMessage && !localError && <p className="text-xs text-rose-800">{errorMessage}</p>}
            {validationErrors && validationErrors.length > 0 && (
              <ul className="list-disc list-inside text-xs text-rose-700 space-y-0.5 mt-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Section 1: Patient Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              1. Patient Demographics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Patient Age</label>
                <span className="text-[11px] text-slate-500">Normal range: 1 - 100 yrs</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={120}
                  step={1}
                  required
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">years</span>
              </div>
            </div>

            {/* Gender */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Biological Sex / Gender</label>
                <span className="text-[11px] text-slate-500">Demographic category</span>
              </div>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value as "Male" | "Female")}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Liver Function Parameters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                2. Liver Function Parameters (LFT)
              </h3>
            </div>
            <span className="text-xs text-slate-500">All standard serum markers required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Total Bilirubin */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Total Bilirubin
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "tb" ? null : "tb")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 0.1 - 1.2</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100.0"
                  required
                  value={formData.total_bilirubin}
                  onChange={(e) => handleInputChange("total_bilirubin", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">mg/dL</span>
              </div>
              {activeTooltip === "tb" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Combined direct and indirect bilirubin; key marker for biliary clearance and hemolytic disorders.
                </p>
              )}
            </div>

            {/* Direct Bilirubin */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Direct Bilirubin
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "db" ? null : "db")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 0.0 - 0.3</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="50.0"
                  required
                  value={formData.direct_bilirubin}
                  onChange={(e) => handleInputChange("direct_bilirubin", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">mg/dL</span>
              </div>
              {activeTooltip === "db" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Conjugated bilirubin processed by liver cells; sensitive marker of biliary stasis or obstruction.
                </p>
              )}
            </div>

            {/* Alkaline Phosphatase (ALP) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Alkaline Phosphatase (ALP)
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "alp" ? null : "alp")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 44 - 147</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="5000"
                  required
                  value={formData.alkaline_phosphotase}
                  onChange={(e) => handleInputChange("alkaline_phosphotase", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">IU/L</span>
              </div>
              {activeTooltip === "alp" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Enzyme primarily located in bile canaliculi. Significant elevation suggests cholestasis or infiltrative disease.
                </p>
              )}
            </div>

            {/* ALT / SGPT */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  ALT / SGPT
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "alt" ? null : "alt")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 7 - 56</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="5000"
                  required
                  value={formData.alamine_aminotransferase}
                  onChange={(e) => handleInputChange("alamine_aminotransferase", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">IU/L</span>
              </div>
              {activeTooltip === "alt" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Alanine Aminotransferase; highly specific to hepatocyte injury and active inflammatory necrosis.
                </p>
              )}
            </div>

            {/* AST / SGOT */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  AST / SGOT
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "ast" ? null : "ast")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 10 - 40</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="5000"
                  required
                  value={formData.aspartate_aminotransferase}
                  onChange={(e) => handleInputChange("aspartate_aminotransferase", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">IU/L</span>
              </div>
              {activeTooltip === "ast" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Aspartate Aminotransferase; elevated in hepatocellular damage. AST/ALT ratio is useful in alcoholic and advanced fibrosis.
                </p>
              )}
            </div>

            {/* Total Proteins */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Total Proteins
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "tp" ? null : "tp")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 6.0 - 8.3</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="15.0"
                  required
                  value={formData.total_protiens}
                  onChange={(e) => handleInputChange("total_protiens", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">g/dL</span>
              </div>
              {activeTooltip === "tp" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Total serum proteins reflecting liver protein synthesis and circulating immunoglobulins.
                </p>
              )}
            </div>

            {/* Albumin */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Albumin
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "alb" ? null : "alb")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 3.5 - 5.0</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  required
                  value={formData.albumin}
                  onChange={(e) => handleInputChange("albumin", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">g/dL</span>
              </div>
              {activeTooltip === "alb" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Synthesized only by hepatocytes; levels decline in chronic liver insufficiency and cirrhosis.
                </p>
              )}
            </div>

            {/* Albumin and Globulin Ratio (A/G Ratio) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  A/G Ratio
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(activeTooltip === "ag" ? null : "ag")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </label>
                <span className="text-[11px] text-slate-500">Ref: 1.0 - 2.5</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="6.0"
                  required
                  value={formData.albumin_and_globulin_ratio}
                  onChange={(e) => handleInputChange("albumin_and_globulin_ratio", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none text-slate-900 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">ratio</span>
              </div>
              {activeTooltip === "ag" && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                  Ratio of albumin to globulin. Inversion (&lt; 1.0) is a classic indicator of chronic liver disease or cirrhosis.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 max-w-lg">
            Evaluation executes the trained Scikit-learn Pipeline and computes local TreeSHAP attributions in real time.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
              isLoading
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-teal-700 text-white hover:bg-teal-800"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Computing Risk & SHAP...
              </>
            ) : (
              <>
                Predict Liver Disease Risk
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
