"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Plane,
  UtensilsCrossed,
  ShoppingBag,
  Zap,
  Flame,
  Droplets,
  Home,
  Upload,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Leaf,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types for API responses
interface DashboardStats {
  totalCarbon: number;
  monthlyChange: number;
  highestImpact: { category: string; percentage: number };
  monthlyGoal: { target: number; remaining: number };
}

interface CategoryBreakdown {
  category: string;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

interface CategoryChartData {
  category: string;
  percentage: number;
  color: string;
}

interface TrendData {
  month: string;
  value: number;
}

interface ApiDashboardResponse {
  stats: {
    totalCarbon: number;
    monthlyChange: number;
    highestImpact: { category: string; percentage: number };
    monthlyGoal: { target: number; current: number; remaining: number };
  };
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  trendData: { month: string; value: number }[];
}

const categoryColors: Record<string, string> = {
  Travel: "#22c55e",
  Food: "#f59e0b",
  Shopping: "#a855f7",
  Electricity: "#eab308",
  Gas: "#f97316",
  Water: "#06b6d4",
  Home: "#ec4899",
};

const categoryIcons: Record<string, React.ReactNode> = {
  Travel: <Plane className="w-4 h-4" />,
  Food: <UtensilsCrossed className="w-4 h-4" />,
  Shopping: <ShoppingBag className="w-4 h-4" />,
  Electricity: <Zap className="w-4 h-4" />,
  Gas: <Flame className="w-4 h-4" />,
  Water: <Droplets className="w-4 h-4" />,
  Home: <Home className="w-4 h-4" />,
};

export default function DashboardPage() {
  const { token, handleUnauthorized } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCarbon: 0,
    monthlyChange: 0,
    highestImpact: { category: "N/A", percentage: 0 },
    monthlyGoal: { target: 150, remaining: 150 },
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Manual transaction form state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    name: "",
    description: "",
    category: "Shopping",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data: ApiDashboardResponse = await response.json();

        // Safely transform API response to component state with defaults
        const stats = data.stats || {};
        const categoryBreakdown = data.categoryBreakdown || [];
        const trendData = data.trendData || [];

        setStats({
          totalCarbon: Math.round((stats.totalCarbon || 0) * 100) / 100,
          monthlyChange: Math.round((stats.monthlyChange || 0) * 100) / 100,
          highestImpact: {
            category: stats.highestImpact?.category || "N/A",
            percentage: Math.round(stats.highestImpact?.percentage || 0),
          },
          monthlyGoal: {
            target: stats.monthlyGoal?.target || 150,
            remaining: Math.max(
              0,
              (stats.monthlyGoal?.target || 150) - (stats.totalCarbon || 0)
            ),
          },
        });

        // Transform trend data
        const trend = trendData.map((item) => ({
          month: item.month,
          value: Math.round((item.value || 0) * 100) / 100,
        }));
        setTrendData(trend);

        // Transform category breakdown
        const categories = categoryBreakdown.map((cat) => ({
          category: cat.category,
          percentage: Math.round(cat.percentage || 0),
          color: categoryColors[cat.category] || "#6b7280",
          icon: categoryIcons[cat.category] || categoryIcons.Shopping,
        }));
        setCategoryData(categories);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/transactions/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message:
            data.message || `Imported ${data.imported_count} transactions`,
        });
        // Refresh dashboard data after successful import
        fetchDashboardData();
      } else {
        setUploadResult({
          success: false,
          message: data.detail || "Failed to import transactions",
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: transactionForm.name,
          description: transactionForm.description,
          category: transactionForm.category,
          amount: parseFloat(transactionForm.amount),
          date: transactionForm.date,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: `Added transaction: ${data.name} (${data.carbon} kg CO₂)`,
        });
        // Reset form
        setTransactionForm({
          name: "",
          description: "",
          category: "Shopping",
          amount: "",
          date: new Date().toISOString().split("T")[0],
        });
        // Refresh dashboard
        fetchDashboardData();
        // Close form after 2 seconds
        setTimeout(() => {
          setShowAddTransaction(false);
          setSubmitResult(null);
        }, 2000);
      } else {
        setSubmitResult({
          success: false,
          message: data.detail || "Failed to add transaction",
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Understand Your Carbon Footprint
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track, analyze, and reduce your environmental impact
          </p>
        </div>
        <button
          onClick={() => setShowAddTransaction(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add Transaction
              </h2>
              <button
                onClick={() => {
                  setShowAddTransaction(false);
                  setSubmitResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {submitResult && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  submitResult.success
                    ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                {submitResult.message}
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Merchant / Description
                </label>
                <input
                  type="text"
                  value={transactionForm.name}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      name: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g., Swiggy, Amazon, Indian Oil"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={transactionForm.category}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                >
                  <option value="Travel">Travel</option>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Gas">Gas</option>
                  <option value="Water">Water</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transactionForm.amount}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        amount: e.target.value,
                      })
                    }
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        date: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Additional details..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTransaction(false);
                    setSubmitResult(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Transaction"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Carbon Footprint */}
        <div className="bg-[#22c55e] rounded-xl p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm">Total Carbon Footprint</p>
              <p className="text-3xl font-semibold mt-2">
                {stats.totalCarbon} kg
              </p>
              <p className="text-white/70 text-xs mt-1">CO₂ this month</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-xs mt-3 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            {Math.abs(stats.monthlyChange)}% vs last month
          </p>
        </div>

        {/* Monthly Change */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Monthly Change
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
                {stats.monthlyChange}%
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Great progress!
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            </div>
          </div>
          <p className="text-[#22c55e] text-xs mt-3 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            {Math.abs(stats.monthlyChange)}% improvement
          </p>
        </div>

        {/* Highest Impact */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Highest Impact
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
                {stats.highestImpact.category}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                {stats.highestImpact.percentage}% of emissions
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Monthly Goal */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Monthly Goal
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
                {stats.monthlyGoal.target} kg
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                {stats.monthlyGoal.remaining} kg to go
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon Footprint Trend */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Carbon Footprint Trend
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your emissions over the past 12 months
            </p>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151" }}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151" }}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#22c55e" }}
                formatter={(value) => [`${value} kg CO₂`, "Emissions"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Category Breakdown
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Emissions by spending category
            </p>
          </div>

          {categoryData.some((c) => c.percentage > 0) ? (
            <div className="flex gap-4 items-center">
              {/* Pie Chart */}
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData
                        .filter((c) => c.percentage > 0)
                        .map((c) => ({
                          category: c.category,
                          percentage: c.percentage,
                          color: c.color,
                        }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="percentage"
                      nameKey="category"
                    >
                      {categoryData
                        .filter((c) => c.percentage > 0)
                        .map((entry) => (
                          <Cell key={entry.category} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "8px",
                      }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {categoryData.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        {cat.icon}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {cat.category}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg
                  className="w-10 h-10 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-sm">No data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Transactions Section */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Import Bank Transactions
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Upload your bank statement to automatically calculate carbon
            emissions
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? "border-[#22c55e] bg-[#22c55e]/5"
              : "border-gray-300 dark:border-[#3a3a3a] hover:border-[#22c55e]/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <div className="w-12 h-12 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
                <p className="text-gray-600 dark:text-gray-300">
                  Processing your file...
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-[#22c55e]/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#22c55e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Drag and drop your file here
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    or click to browse
                  </p>
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  Supports CSV, XLS, XLSX files
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              uploadResult.success
                ? "bg-[#22c55e]/10 text-[#22c55e]"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {uploadResult.success ? (
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <p className="text-sm">{uploadResult.message}</p>
          </div>
        )}

        {/* Supported Banks Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Supported formats: HDFC Bank, ICICI Bank, SBI, Axis Bank, Kotak
            Mahindra, and most major Indian banks. Your file should have columns
            for date, description/narration, and amount (debit/withdrawal).
          </p>
        </div>
      </div>
    </div>
  );
}
