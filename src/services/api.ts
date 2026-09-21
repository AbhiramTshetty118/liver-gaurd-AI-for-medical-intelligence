import axios, { AxiosError } from "axios";
import {
  PatientInput,
  PredictionResult,
  ModelMetadata,
  ModelMetrics,
  MonitoringTelemetry,
  HistoryItem,
  User
} from "../types";

const API_BASE = "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach JWT token if stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("liverguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  statusCode?: number;
  details?: string[];

  constructor(message: string, statusCode?: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ detail?: any; errors?: string[] }>;
    const status = err.response?.status;
    const responseData = err.response?.data;

    if (!err.response) {
      throw new ApiError(
        "Cannot reach the LiverGuard ML server. The backend service may be initializing or network is unavailable.",
        0
      );
    }

    if (status === 422) {
      const details = responseData?.errors || (Array.isArray(responseData?.detail)
        ? responseData.detail.map((d: any) => `${d.loc?.join(".") || "field"}: ${d.msg}`)
        : [String(responseData?.detail || "Input parameter validation error.")]);
      throw new ApiError(
        "Clinical parameter validation error. Please verify all laboratory values.",
        422,
        details
      );
    }

    if (status === 401) {
      throw new ApiError(
        typeof responseData?.detail === "string" ? responseData.detail : "Invalid credentials or expired session.",
        401
      );
    }

    if (status === 429) {
      throw new ApiError(
        "Request rate limit exceeded. Please wait a moment before submitting another prediction.",
        429
      );
    }

    const message = typeof responseData?.detail === "string"
      ? responseData.detail
      : "The server encountered an error computing the risk assessment.";
    throw new ApiError(message, status);
  }

  throw new ApiError("An unexpected client error occurred.");
}

export const api = {
  async predictRisk(data: PatientInput): Promise<PredictionResult> {
    try {
      const res = await apiClient.post<PredictionResult>("/predict", data);
      return res.data;
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async predictAndExplain(data: PatientInput): Promise<PredictionResult> {
    try {
      const res = await apiClient.post<PredictionResult>("/predict/explain", data);
      return res.data;
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async getModelInfo(): Promise<ModelMetadata> {
    try {
      const res = await apiClient.get<ModelMetadata>("/model-info");
      return res.data;
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async getMetrics(): Promise<ModelMetrics> {
    try {
      const res = await apiClient.get<ModelMetrics>("/metrics");
      return res.data;
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async getMonitoring(): Promise<MonitoringTelemetry> {
    try {
      const res = await apiClient.get<MonitoringTelemetry>("/monitoring");
      return res.data;
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async getHistory(): Promise<HistoryItem[]> {
    try {
      const res = await apiClient.get<{ total: number; items: HistoryItem[] }>("/history");
      return res.data.items || [];
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async getSingleHistory(id: string): Promise<HistoryItem> {
    try {
      const res = await apiClient.get<HistoryItem>(`/history/${id}`);
      return res.data;
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await apiClient.post<{ access_token: string; user: User }>("/auth/login", {
        email,
        password
      });
      localStorage.setItem("liverguard_token", res.data.access_token);
      localStorage.setItem("liverguard_user", JSON.stringify(res.data.user));
      return { token: res.data.access_token, user: res.data.user };
    } catch (err) {
      handleAxiosError(err);
    }
  },

  async register(email: string, password: string, fullName: string): Promise<{ token: string; user: User }> {
    try {
      const res = await apiClient.post<{ access_token: string; user: User }>("/auth/register", {
        email,
        password,
        full_name: fullName
      });
      localStorage.setItem("liverguard_token", res.data.access_token);
      localStorage.setItem("liverguard_user", JSON.stringify(res.data.user));
      return { token: res.data.access_token, user: res.data.user };
    } catch (err) {
      handleAxiosError(err);
    }
  },

  logout(): void {
    localStorage.removeItem("liverguard_token");
    localStorage.removeItem("liverguard_user");
  },

  getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem("liverguard_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
    try {
      const res = await apiClient.get<{ status: string; model_loaded: boolean }>("/health");
      return res.data;
    } catch {
      return { status: "offline", model_loaded: false };
    }
  }
};
