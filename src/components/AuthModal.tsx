import React, { useState } from "react";
import { X, Lock, Mail, User as UserIcon, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register(email, password, fullName);
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isRegister ? "Clinician Account Registration" : "Clinician Workspace Sign-In"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely authenticate to isolate and review your department's prediction history.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Dr. Jane Doe, Hepatology"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Work Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="clinician@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Authenticating...
              </>
            ) : isRegister ? (
              "Create Clinician Account"
            ) : (
              "Sign In to Workspace"
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-teal-700 font-bold hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a department account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-teal-700 font-bold hover:underline"
              >
                Register Here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
