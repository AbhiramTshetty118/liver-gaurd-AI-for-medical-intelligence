import React, { useState } from "react";
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp,
  BarChart2
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";
import { PredictionResult } from "../types";

interface PredictionResultViewProps {
  result: PredictionResult;
  onReset: () => void;
  onViewTelemetry?: () => void;
}

export const PredictionResultView: React.FC<PredictionResultViewProps> = ({
  result,
  onReset,
  onViewTelemetry
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullInputs, setShowFullInputs] = useState(false);

  const probPercent = Math.round(result.probability * 1000) / 10;
  const isElevated = result.probability >= result.decision_threshold;

  // Visual styling based on risk level
  const getBadgeStyle = () => {
    switch (result.risk_level) {
      case "High Risk":
      case "Elevated Risk":
        return {
          bg: "bg-rose-50",
          border: "border-rose-300",
          text: "text-rose-900",
          accent: "text-rose-700",
          barColor: "#e11d48",
          headline: "Model Indicates Elevated Risk Pattern"
        };
      case "Moderate / Borderline Risk":
        return {
          bg: "bg-amber-50",
          border: "border-amber-300",
          text: "text-amber-900",
          accent: "text-amber-700",
          barColor: "#d97706",
          headline: "Model Indicates Borderline Risk Pattern"
        };
      default:
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-300",
          text: "text-emerald-900",
          accent: "text-emerald-700",
          barColor: "#059669",
          headline: "Model Indicates Low Risk Pattern"
        };
    }
  };

  const style = getBadgeStyle();

  // Prepare SHAP chart data
  const shapChartData = (result.explanation || []).map((item) => ({
    name: item.display_name,
    shap: Number(item.shap_value.toFixed(4)),
    rawShap: item.shap_value,
    impact: Math.abs(item.shap_value),
    direction: item.direction,
    value: item.value,
    note: item.clinical_note
  }));

  const handleCopySummary = () => {
    const text = `LiverGuard Assessment Summary
ID: ${result.id}
Date: ${new Date(result.timestamp).toLocaleString()}
Model: ${result.model_version}
Risk Classification: ${result.risk_level}
Calculated Probability: ${probPercent}% (Screening Threshold: ${result.decision_threshold * 100}%)
Top Risk Factors:
${result.explanation.slice(0, 4).map((f) => `- ${f.display_name} (${f.value}): ${f.direction === "increases_risk" ? "+" : "-"}${Math.abs(f.shap_value).toFixed(3)} SHAP`).join("\n")}

Disclaimer: ${result.disclaimer}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Medical Disclaimer Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-amber-900 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold">Clinical Safety Notice: </span>
          {result.disclaimer}
        </div>
      </div>

      {/* Main Result Card */}
      <div className={`rounded-xl border ${style.border} ${style.bg} p-6 sm:p-8 shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span>Model Version: {result.model_version}</span>
              <span>•</span>
              <span>Audit ID: {result.id}</span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-bold ${style.text} tracking-tight`}>
              {style.headline}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              Based on the submitted liver function panel, the statistical model generated a risk probability of{" "}
              <strong className="text-slate-900">{probPercent}%</strong> against the clinical screening threshold of{" "}
              <strong>{(result.decision_threshold * 100).toFixed(1)}%</strong>.
            </p>
          </div>

          {/* Calibrated Probability Visual Indicator */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 min-w-[220px] text-center shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assessed Probability
            </div>
            <div className={`text-4xl sm:text-5xl font-extrabold ${style.accent} my-1`}>
              {probPercent}%
            </div>
            <div className="text-xs font-medium text-slate-700">
              Stratification: <span className="font-bold">{result.risk_level}</span>
            </div>

            {/* Gauge progress bar */}
            <div className="mt-3 relative pt-1">
              <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-100 border border-slate-200">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, probPercent))}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    isElevated ? "bg-rose-600" : "bg-emerald-600"
                  }`}
                ></div>
              </div>
              {/* Threshold marker */}
              <div
                className="absolute top-0 w-0.5 h-4 bg-slate-900"
                style={{ left: `${result.decision_threshold * 100}%` }}
                title={`Screening Threshold: ${(result.decision_threshold * 100).toFixed(1)}%`}
              >
                <div className="text-[9px] font-mono text-slate-600 -translate-x-1/2 pt-3 whitespace-nowrap">
                  Cutoff {(result.decision_threshold * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Breakdown (SHAP Feature Contributions) */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-teal-700" />
                Individual Feature Contributions (TreeSHAP Analysis)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Exact mathematical Shapley attribution quantifying how each specific lab value shifted the model from
                the dataset baseline.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span>
                <span>Increases Risk (+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-teal-600 inline-block"></span>
                <span>Decreases Risk (-)</span>
              </div>
            </div>
          </div>

          {/* Recharts SHAP Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} domain={["auto", "auto"]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#1e293b", fontWeight: 500 }}
                    width={115}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 max-w-xs border border-slate-800">
                            <div className="font-bold text-teal-300">{data.name}</div>
                            <div>Patient Value: <span className="font-semibold text-white">{data.value}</span></div>
                            <div>
                              SHAP Impact:{" "}
                              <span className={data.shap > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                                {data.shap > 0 ? `+${data.shap}` : data.shap}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-700">
                              {data.note}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Bar dataKey="shap" radius={[0, 4, 4, 0]}>
                    {shapChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.shap > 0 ? "#e11d48" : "#0d9488"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clinical Insights List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {result.explanation.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-200 p-3.5 flex items-start gap-3 shadow-2xs"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.direction === "increases_risk"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-teal-50 text-teal-700 border border-teal-200"
                  }`}
                >
                  {item.direction === "increases_risk" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.display_name}</span>
                    <span className="font-mono text-slate-500 font-medium">Val: {item.value}</span>
                  </div>
                  <p className="text-slate-600 leading-snug">{item.clinical_note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accordion for Input Parameter Verification */}
        <div className="mt-6 pt-6 border-t border-slate-200/80">
          <button
            onClick={() => setShowFullInputs(!showFullInputs)}
            className="flex items-center justify-between w-full text-left font-semibold text-xs text-slate-700 hover:text-slate-900"
          >
            <span>Review Entered Laboratory Values vs Reference Ranges</span>
            {showFullInputs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullInputs && (
            <div className="mt-4 overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-2.5">Parameter</th>
                    <th className="px-4 py-2.5">Patient Input</th>
                    <th className="px-4 py-2.5">Typical Normal Range</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="px-4 py-2 font-medium">Age</td>
                    <td className="px-4 py-2">{result.input_summary.age} yrs</td>
                    <td className="px-4 py-2 text-slate-500">—</td>
                    <td className="px-4 py-2 text-slate-600">Recorded</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Gender</td>
                    <td className="px-4 py-2">{result.input_summary.gender}</td>
                    <td className="px-4 py-2 text-slate-500">—</td>
                    <td className="px-4 py-2 text-slate-600">Recorded</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Total Bilirubin</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.total_bilirubin} mg/dL</td>
                    <td className="px-4 py-2 text-slate-500">0.1 – 1.2 mg/dL</td>
                    <td className="px-4 py-2">
                      {result.input_summary.total_bilirubin > 1.2 ? (
                        <span className="text-rose-700 font-semibold">Elevated</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Direct Bilirubin</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.direct_bilirubin} mg/dL</td>
                    <td className="px-4 py-2 text-slate-500">0.0 – 0.3 mg/dL</td>
                    <td className="px-4 py-2">
                      {result.input_summary.direct_bilirubin > 0.3 ? (
                        <span className="text-rose-700 font-semibold">Elevated</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Alkaline Phosphatase (ALP)</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.alkaline_phosphotase} IU/L</td>
                    <td className="px-4 py-2 text-slate-500">44 – 147 IU/L</td>
                    <td className="px-4 py-2">
                      {result.input_summary.alkaline_phosphotase > 147 ? (
                        <span className="text-rose-700 font-semibold">Elevated</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">ALT / SGPT</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.alamine_aminotransferase} IU/L</td>
                    <td className="px-4 py-2 text-slate-500">7 – 56 IU/L</td>
                    <td className="px-4 py-2">
                      {result.input_summary.alamine_aminotransferase > 56 ? (
                        <span className="text-rose-700 font-semibold">Elevated</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">AST / SGOT</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.aspartate_aminotransferase} IU/L</td>
                    <td className="px-4 py-2 text-slate-500">10 – 40 IU/L</td>
                    <td className="px-4 py-2">
                      {result.input_summary.aspartate_aminotransferase > 40 ? (
                        <span className="text-rose-700 font-semibold">Elevated</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Total Proteins</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.total_protiens} g/dL</td>
                    <td className="px-4 py-2 text-slate-500">6.0 – 8.3 g/dL</td>
                    <td className="px-4 py-2">
                      {result.input_summary.total_protiens < 6.0 ? (
                        <span className="text-rose-700 font-semibold">Low</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Albumin</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.albumin} g/dL</td>
                    <td className="px-4 py-2 text-slate-500">3.5 – 5.0 g/dL</td>
                    <td className="px-4 py-2">
                      {result.input_summary.albumin < 3.5 ? (
                        <span className="text-rose-700 font-semibold">Depressed</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">A/G Ratio</td>
                    <td className="px-4 py-2 font-semibold">{result.input_summary.albumin_and_globulin_ratio}</td>
                    <td className="px-4 py-2 text-slate-500">1.0 – 2.5</td>
                    <td className="px-4 py-2">
                      {result.input_summary.albumin_and_globulin_ratio < 1.0 ? (
                        <span className="text-rose-700 font-semibold">Inverted (&lt; 1.0)</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              {copied ? "Copied to Clipboard!" : "Copy Summary"}
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Report
            </button>
          </div>

          <button
            onClick={onReset}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Evaluate Another Patient Profile
          </button>
        </div>
      </div>
    </div>
  );
};
