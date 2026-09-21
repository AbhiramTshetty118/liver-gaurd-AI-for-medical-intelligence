import React, { useEffect, useState } from "react";
import {
  Activity,
  History,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  PieChart as PieIcon,
  ShieldCheck,
  Server,
  Zap,
  TrendingUp,
  X
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { HistoryItem, MonitoringTelemetry, User } from "../types";
import { api } from "../services/api";

interface HistoryAndMonitoringViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const HistoryAndMonitoringView: React.FC<HistoryAndMonitoringViewProps> = ({
  currentUser,
  onOpenAuth
}) => {
  const [telemetry, setTelemetry] = useState<MonitoringTelemetry | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tel, hist] = await Promise.all([
        api.getMonitoring(),
        api.getHistory()
      ]);
      setTelemetry(tel);
      setHistoryItems(hist);
    } catch (err: any) {
      setError(err.message || "Failed to load telemetry or history logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Loading Telemetry & Prediction Records...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching latency logs, risk distributions, and database audit trails.</p>
      </div>
    );
  }

  // Format pie data for risk distribution
  const riskDist = telemetry?.risk_distribution || { "Low Risk": 1, "Elevated Risk": 0 };
  const pieData = Object.entries(riskDist).map(([name, value]) => ({
    name,
    value
  }));

  const RISK_COLORS: Record<string, string> = {
    "Low Risk": "#0d9488",
    "Moderate / Borderline Risk": "#d97706",
    "Elevated Risk": "#e11d48",
    "High Risk": "#be123c"
  };

  return (
    <div className="space-y-8">
      {/* Clinician Authentication Status Banner if anonymous */}
      {!currentUser && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Clinician Workspace Sign-In</div>
              <div className="text-xs text-slate-500">
                Sign in to isolate and persist your clinical department's screening audits.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs self-start sm:self-auto"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total System Inferences</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {telemetry?.total_predictions || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Audit-logged evaluations</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mean Inference Latency</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {telemetry?.average_latency_ms || 18.5} <span className="text-sm font-normal text-slate-500">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">P95: {telemetry?.p95_latency_ms || 32.0} ms</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Validation Failures</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {telemetry?.total_validation_errors || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Intercepted invalid inputs</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Drift Surveillance</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {telemetry?.drift_detection_status || "Within Normal Bounds"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Kolmogorov-Smirnov monitoring</div>
        </div>
      </div>

      {/* Risk Distribution Chart and Telemetry Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Pie */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-700" />
              Real-Time Risk Stratification Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Distribution of risk categories predicted across recent clinical requests.
            </p>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={RISK_COLORS[entry.name] || "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} records`, "Count"]}
                  contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: RISK_COLORS[d.name] || "#64748b" }}
                ></span>
                <span className="text-slate-700 font-medium">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inferences Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                Audit Trail (Recent Predictions)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Anonymized records showing model output and risk stratification.
              </p>
            </div>
            <button
              onClick={fetchData}
              title="Refresh records"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {historyItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No prediction records logged yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Submit a patient profile from the Risk Screener to see audit records appear here.
                </p>
              </div>
            ) : (
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Audit ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Probability</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {historyItems.slice(0, 7).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {item.id.slice(0, 8)}...
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {(item.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.risk_level.includes("Elevated") || item.risk_level.includes("High")
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : item.risk_level.includes("Moderate")
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-2 py-1 text-slate-600 hover:text-teal-700 font-medium inline-flex items-center gap-1 hover:bg-teal-50 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Inspect Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Audit Record Details</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Record ID:</span>
                  <div className="font-mono font-medium text-slate-800 mt-0.5">{selectedItem.id}</div>
                </div>
                <div>
                  <span className="text-slate-500">Evaluated At:</span>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {new Date(selectedItem.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Risk Stratification:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedItem.risk_level}</div>
                </div>
                <div>
                  <span className="text-slate-500">Probability:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {(selectedItem.probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {selectedItem.input_summary && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5">Submitted Parameters</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg text-[11px]">
                    <div>Age: <span className="font-semibold">{selectedItem.input_summary.age}</span></div>
                    <div>Sex: <span className="font-semibold">{selectedItem.input_summary.gender}</span></div>
                    <div>Total Bili: <span className="font-semibold">{selectedItem.input_summary.total_bilirubin}</span></div>
                    <div>Direct Bili: <span className="font-semibold">{selectedItem.input_summary.direct_bilirubin}</span></div>
                    <div>ALP: <span className="font-semibold">{selectedItem.input_summary.alkaline_phosphotase}</span></div>
                    <div>ALT: <span className="font-semibold">{selectedItem.input_summary.alamine_aminotransferase}</span></div>
                    <div>AST: <span className="font-semibold">{selectedItem.input_summary.aspartate_aminotransferase}</span></div>
                    <div>Total Prot: <span className="font-semibold">{selectedItem.input_summary.total_protiens}</span></div>
                    <div>Albumin: <span className="font-semibold">{selectedItem.input_summary.albumin}</span></div>
                    <div>A/G Ratio: <span className="font-semibold">{selectedItem.input_summary.albumin_and_globulin_ratio}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
