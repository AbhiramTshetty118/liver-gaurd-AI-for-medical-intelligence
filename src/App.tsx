import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { LandingHero } from "./components/LandingHero";
import { PredictionForm } from "./components/PredictionForm";
import { PredictionResultView } from "./components/PredictionResultView";
import { ModelEvaluationDashboard } from "./components/ModelEvaluationDashboard";
import { HistoryAndMonitoringView } from "./components/HistoryAndMonitoringView";
import { AboutAndGuideView } from "./components/AboutAndGuideView";
import { AuthModal } from "./components/AuthModal";
import { api, ApiError } from "./services/api";
import { PatientInput, PredictionResult, User } from "./types";
import { ShieldAlert, Heart, Github, Activity, BookOpen, Database } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"predict" | "models" | "dashboard" | "about">("predict");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Prediction flow state
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[] | undefined>(undefined);

  // System status
  const [systemHealthy, setSystemHealthy] = useState(true);

  // On mount check health & check stored user
  useEffect(() => {
    const user = api.getStoredUser();
    if (user) setCurrentUser(user);

    const checkSystem = async () => {
      const health = await api.checkHealth();
      setSystemHealthy(health.status === "healthy" || health.status === "degraded");
    };
    checkSystem();
    const interval = setInterval(checkSystem, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePredict = async (data: PatientInput) => {
    setIsPredicting(true);
    setPredictError(null);
    setValidationErrors(undefined);

    try {
      const result = await api.predictAndExplain(data);
      setPredictionResult(result);
      // Smooth scroll to top of result
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setPredictError(err.message);
        setValidationErrors(err.details);
      } else {
        setPredictError("A network error occurred while submitting the patient profile.");
      }
    } finally {
      setIsPredicting(false);
    }
  };

  const handleResetPrediction = () => {
    setPredictionResult(null);
    setPredictError(null);
    setValidationErrors(undefined);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        systemHealthy={systemHealthy}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === "predict" && (
          <div className="space-y-8">
            {/* Show Landing Hero when no active prediction result is being viewed */}
            {!predictionResult && (
              <LandingHero
                onStartScreener={() => {
                  const formEl = document.getElementById("prediction-form-anchor");
                  if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
                }}
                onViewMetrics={() => setActiveTab("models")}
              />
            )}

            <div id="prediction-form-anchor" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              {predictionResult ? (
                <PredictionResultView
                  result={predictionResult}
                  onReset={handleResetPrediction}
                  onViewTelemetry={() => setActiveTab("dashboard")}
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Clinical Screening Assessment</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submit clinical parameters to calculate risk probability and view local TreeSHAP attributions.
                      </p>
                    </div>
                  </div>

                  <PredictionForm
                    onSubmit={handlePredict}
                    isLoading={isPredicting}
                    errorMessage={predictError}
                    validationErrors={validationErrors}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "models" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <ModelEvaluationDashboard />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <HistoryAndMonitoringView
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <AboutAndGuideView />
          </div>
        )}
      </main>

      {/* Persistent Medical Disclaimer & Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 mb-6 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              <strong>Regulatory & Clinical Disclaimer:</strong> LiverGuard is an experimental machine-learning application
              for research and educational risk stratification. It is <em>not</em> an FDA/CE-cleared medical device, does
              not diagnose conditions, and cannot replace individualized clinical judgment by licensed medical professionals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
                LG
              </div>
              <span className="font-semibold text-slate-700">LiverGuard ML Clinical System</span>
              <span>•</span>
              <span>UCI ILPD Calibrated Random Forest</span>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => setActiveTab("about")} className="hover:text-teal-700 transition-colors">
                Clinical Reference Guide
              </button>
              <button onClick={() => setActiveTab("models")} className="hover:text-teal-700 transition-colors">
                Model Performance & ROC
              </button>
              <button onClick={() => setActiveTab("dashboard")} className="hover:text-teal-700 transition-colors">
                Telemetry & Audits
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Clinician Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
