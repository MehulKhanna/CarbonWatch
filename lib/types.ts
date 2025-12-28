// ===========================================
// Carbon Watch - API Type Definitions
// ===========================================

// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Categories
export type Category =
  | "Travel"
  | "Food"
  | "Shopping"
  | "Electricity"
  | "Gas"
  | "Water"
  | "Home";

// Transactions
export interface Transaction {
  id: string;
  userId: string;
  name: string;
  category: Category;
  date: string;
  amount: number;
  carbon: number; // kg CO2
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  name: string;
  category: Category;
  date: string;
  amount: number;
  carbon?: number; // Can be auto-calculated by backend
  description?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalEmissions: number;
}

// Dashboard
export interface DashboardStats {
  totalCarbon: number;
  monthlyChange: number; // percentage
  highestImpact: {
    category: Category;
    percentage: number;
  };
  monthlyGoal: {
    target: number;
    current: number;
    remaining: number;
  };
}

export interface CategoryBreakdown {
  category: Category;
  amount: number; // kg CO2
  percentage: number;
}

export interface TrendDataPoint {
  month: string;
  value: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  categoryBreakdown: CategoryBreakdown[];
  trendData: TrendDataPoint[];
}

// Insights
export type Priority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  tip: string;
  potentialSavings: string;
  priority: Priority;
  category: Category;
}

export interface InsightsResponse {
  potentialMonthlySavings: number;
  recommendations: Recommendation[];
  ecoScore: string;
  focusArea: Category;
}

// Progress
export interface EmissionTrend {
  period: "Week" | "Month" | "Quarter";
  current: number;
  previous: number;
  changePercent: number;
  goal: number;
  progressPercent: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number; // 0-100
}

export interface ProgressResponse {
  motivationalMessage: string;
  emissionTrends: EmissionTrend[];
  achievements: Achievement[];
  tips: string[];
  streak: number;
  totalCarbonSaved: number;
}

// Goals
export interface Goal {
  id: string;
  userId: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  progress: number;
  completed: boolean;
  createdAt: string;
}

export interface GoalCreate {
  title: string;
  target: number;
  unit: string;
  deadline: string;
}

// API Error
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Filter params
export interface TransactionFilters extends PaginationParams {
  category?: Category;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}
