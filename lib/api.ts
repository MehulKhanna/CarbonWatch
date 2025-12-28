// ===========================================
// Carbon Watch - API Client Service
// ===========================================

import type {
  AuthResponse,
  DashboardResponse,
  TransactionsResponse,
  TransactionFilters,
  TransactionCreate,
  Transaction,
  InsightsResponse,
  ProgressResponse,
  Goal,
  GoalCreate,
  User,
  ApiError,
} from "./types";

// Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken");
  }
  return accessToken;
};

// Base fetch wrapper with auth
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    }));
    throw error;
  }

  return response.json();
}

// ===========================================
// Auth API
// ===========================================
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(response.accessToken);
    return response;
  },

  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setAccessToken(response.accessToken);
    return response;
  },

  logout: async (): Promise<void> => {
    await fetchApi("/auth/logout", { method: "POST" });
    setAccessToken(null);
  },

  getProfile: async (): Promise<User> => {
    return fetchApi<User>("/auth/profile");
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    setAccessToken(response.accessToken);
    return response;
  },
};

// ===========================================
// Dashboard API
// ===========================================
export const dashboardApi = {
  getStats: async (): Promise<DashboardResponse> => {
    return fetchApi<DashboardResponse>("/dashboard");
  },

  getTrend: async (
    period: "week" | "month" | "year" = "year"
  ): Promise<DashboardResponse["trendData"]> => {
    return fetchApi(`/dashboard/trend?period=${period}`);
  },
};

// ===========================================
// Transactions API
// ===========================================
export const transactionsApi = {
  getAll: async (
    filters?: TransactionFilters
  ): Promise<TransactionsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return fetchApi<TransactionsResponse>(
      `/transactions${queryString ? `?${queryString}` : ""}`
    );
  },

  getById: async (id: string): Promise<Transaction> => {
    return fetchApi<Transaction>(`/transactions/${id}`);
  },

  create: async (data: TransactionCreate): Promise<Transaction> => {
    return fetchApi<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<TransactionCreate>
  ): Promise<Transaction> => {
    return fetchApi<Transaction>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/transactions/${id}`, { method: "DELETE" });
  },

  // Bulk import transactions (e.g., from bank CSV)
  bulkImport: async (
    transactions: TransactionCreate[]
  ): Promise<Transaction[]> => {
    return fetchApi<Transaction[]>("/transactions/bulk", {
      method: "POST",
      body: JSON.stringify({ transactions }),
    });
  },
};

// ===========================================
// Insights API
// ===========================================
export const insightsApi = {
  getAll: async (): Promise<InsightsResponse> => {
    return fetchApi<InsightsResponse>("/insights");
  },

  dismissRecommendation: async (id: string): Promise<void> => {
    await fetchApi(`/insights/recommendations/${id}/dismiss`, {
      method: "POST",
    });
  },

  markAsCompleted: async (id: string): Promise<void> => {
    await fetchApi(`/insights/recommendations/${id}/complete`, {
      method: "POST",
    });
  },
};

// ===========================================
// Progress API
// ===========================================
export const progressApi = {
  getAll: async (): Promise<ProgressResponse> => {
    return fetchApi<ProgressResponse>("/progress");
  },

  getAchievements: async (): Promise<ProgressResponse["achievements"]> => {
    return fetchApi("/progress/achievements");
  },

  // Goals
  getGoals: async (): Promise<Goal[]> => {
    return fetchApi<Goal[]>("/progress/goals");
  },

  createGoal: async (data: GoalCreate): Promise<Goal> => {
    return fetchApi<Goal>("/progress/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateGoal: async (id: string, data: Partial<GoalCreate>): Promise<Goal> => {
    return fetchApi<Goal>(`/progress/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteGoal: async (id: string): Promise<void> => {
    await fetchApi(`/progress/goals/${id}`, { method: "DELETE" });
  },
};

// ===========================================
// Export all APIs
// ===========================================
export const api = {
  auth: authApi,
  dashboard: dashboardApi,
  transactions: transactionsApi,
  insights: insightsApi,
  progress: progressApi,
};

export default api;
