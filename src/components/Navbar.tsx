import React from "react";
import { Activity, ShieldCheck, BarChart3, History, BookOpen, User as UserIcon, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  activeTab: "predict" | "models" | "dashboard" | "about";
  setActiveTab: (tab: "predict" | "models" | "dashboard" | "about") => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  systemHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  systemHealthy
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("predict")}>
            <div className="w-10 h-10 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">LiverGuard</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                  ML Clinical v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent Liver Disease Risk Screening</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("predict")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "predict"
                  ? "bg-teal-50 text-teal-900 border border-teal-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Activity className="w-4 h-4" />
              Risk Screener
            </button>

            <button
              onClick={() => setActiveTab("models")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "models"
                  ? "bg-teal-50 text-teal-900 border border-teal-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Model Metrics & Curves
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "dashboard"
                  ? "bg-teal-50 text-teal-900 border border-teal-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <History className="w-4 h-4" />
              Telemetry & History
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "about"
                  ? "bg-teal-50 text-teal-900 border border-teal-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Clinical Guide
            </button>
          </nav>

          {/* System Status & Auth */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700">
              {systemHealthy ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Pipeline Active</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Connecting...</span>
                </>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900">{currentUser.full_name || "Clinician"}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Clinician Portal
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-100 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("predict")}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
              activeTab === "predict" ? "bg-teal-50 text-teal-900 font-semibold" : "text-slate-600"
            }`}
          >
            Screener
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
              activeTab === "models" ? "bg-teal-50 text-teal-900 font-semibold" : "text-slate-600"
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-teal-50 text-teal-900 font-semibold" : "text-slate-600"
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
              activeTab === "about" ? "bg-teal-50 text-teal-900 font-semibold" : "text-slate-600"
            }`}
          >
            Clinical Guide
          </button>
        </div>
      </div>
    </header>
  );
};
