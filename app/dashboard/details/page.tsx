"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { emitTransactionsUpdated } from "@/lib/events";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Plane,
  UtensilsCrossed,
  ShoppingBag,
  Zap,
  Flame,
  Droplets,
  Home,
  ArrowLeft,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Calendar,
  Lightbulb,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Transaction {
  id: string;
  name: string;
  description?: string;
  category: string;
  date: string;
  amount: number;
  carbon: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number;
}

interface Insight {
  id: string;
  category: string;
  title: string;
  tip: string;
  potential_savings: string;
  priority: string;
}

interface PeriodInsights {
  period: string;
  period_label: string;
  recommendations: Insight[];
  primary_insight: {
    category: string;
    message: string;
    savings: string;
  } | null;
}

const categories = [
  "All",
  "Travel",
  "Food",
  "Shopping",
  "Electricity",
  "Gas",
  "Water",
  "Home",
] as const;

const timeFilters = [
  { key: "all", label: "All Time" },
  { key: "week", label: "Last Week" },
  { key: "month", label: "Last Month" },
  { key: "year", label: "Last Year" },
  { key: "custom", label: "Custom Range" },
] as const;

type TimeFilter = (typeof timeFilters)[number]["key"];

const categoryConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ReactNode }
> = {
  Travel: {
    color: "#22c55e",
    bgColor: "#22c55e20",
    icon: <Plane className="w-4 h-4" />,
  },
  Food: {
    color: "#f59e0b",
    bgColor: "#f59e0b20",
    icon: <UtensilsCrossed className="w-4 h-4" />,
  },
  Shopping: {
    color: "#a855f7",
    bgColor: "#a855f720",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  Electricity: {
    color: "#eab308",
    bgColor: "#eab30820",
    icon: <Zap className="w-4 h-4" />,
  },
  Gas: {
    color: "#f97316",
    bgColor: "#f9731620",
    icon: <Flame className="w-4 h-4" />,
  },
  Water: {
    color: "#06b6d4",
    bgColor: "#06b6d420",
    icon: <Droplets className="w-4 h-4" />,
  },
  Home: {
    color: "#ec4899",
    bgColor: "#ec489920",
    icon: <Home className="w-4 h-4" />,
  },
};

export default function DetailsPage() {
  const { token, handleUnauthorized } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalEmissionsFromServer, setTotalEmissionsFromServer] = useState(0);
  const [totalAmountFromServer, setTotalAmountFromServer] = useState(0);
  const pageSize = 50;

  // Insights state
  const [weeklyInsights, setWeeklyInsights] = useState<PeriodInsights | null>(
    null
  );
  const [monthlyInsights, setMonthlyInsights] = useState<PeriodInsights | null>(
    null
  );

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [newTx, setNewTx] = useState({
    name: "",
    category: "Shopping",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Calculate date range based on time filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (timeFilter) {
      case "week":
        startDate = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case "month":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        ).toISOString();
        break;
      case "year":
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        ).toISOString();
        break;
      case "custom":
        if (customStartDate)
          startDate = new Date(customStartDate).toISOString();
        if (customEndDate)
          endDate = new Date(customEndDate + "T23:59:59").toISOString();
        break;
    }

    return { startDate, endDate };
  }, [timeFilter, customStartDate, customEndDate]);

  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Build query params for server-side filtering
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());

      if (activeFilter !== "All") {
        params.set("category", activeFilter);
      }
      if (startDate) {
        params.set("start_date", startDate);
      }
      if (endDate) {
        params.set("end_date", endDate);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const txRes = await fetch(`${API_URL}/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (txRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
        setTotalTransactions(data.total || 0);
        setTotalEmissionsFromServer(data.total_emissions || 0);
        setTotalAmountFromServer(data.total_amount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    token,
    handleUnauthorized,
    currentPage,
    activeFilter,
    timeFilter,
    searchQuery,
    getDateRange,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, timeFilter, searchQuery, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch weekly and monthly insights
  const fetchInsights = useCallback(async () => {
    if (!token) return;

    try {
      const [weekRes, monthRes] = await Promise.all([
        fetch(`${API_URL}/insights?period=week`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/insights?period=month`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (weekRes.ok) {
        const data = await weekRes.json();
        setWeeklyInsights(data);
      }
      if (monthRes.ok) {
        const data = await monthRes.json();
        setMonthlyInsights(data);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Compute category breakdown from filtered transactions
  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    let grandTotal = 0;

    transactions.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.carbon;
      grandTotal += tx.carbon;
    });

    if (grandTotal === 0) return [];

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / grandTotal) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;

    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        // Re-fetch data after delete
        fetchData();
        // Notify dashboard to refresh its data
        emitTransactionsUpdated();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTx.name || !newTx.amount) return;

    setIsAdding(true);
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTx.name,
          category: newTx.category,
          amount: parseFloat(newTx.amount),
          date: newTx.date,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        fetchData(); // Re-fetch to update list
        emitTransactionsUpdated();
        setShowAddModal(false);
        setNewTx({
          name: "",
          category: "Shopping",
          amount: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const totalPages = Math.ceil(totalTransactions / pageSize);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  // Use server-provided totals for accuracy (across all filtered results, not just current page)
  const displayEmissions = totalEmissionsFromServer;
  const displayAmount = totalAmountFromServer;

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Transaction Details
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              View and manage your transactions
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Summary Bar */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {totalTransactions} transactions{" "}
            {totalPages > 1 && `(page ${currentPage}/${totalPages})`}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            <span className="text-[#22c55e]">
              {displayEmissions.toFixed(1)} kg CO₂
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Total spent
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ₹
            {displayAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {/* Category Breakdown (compact) */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Category Breakdown
          </p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown.filter((c) => c.percentage > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                    dataKey="percentage"
                    nameKey="category"
                  >
                    {categoryBreakdown
                      .filter((c) => c.percentage > 0)
                      .map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={
                            categoryConfig[entry.category]?.color || "#6b7280"
                          }
                        />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
              {categoryBreakdown
                .filter((c) => c.percentage > 0)
                .map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          categoryConfig[cat.category]?.color || "#6b7280",
                      }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">
                      {cat.category}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekly & Monthly Insights */}
      {(weeklyInsights?.primary_insight ||
        monthlyInsights?.primary_insight) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekly Insight */}
          {weeklyInsights?.primary_insight && (
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/40 rounded-lg flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                    This Week
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {weeklyInsights.primary_insight.message}
                  </p>
                  {weeklyInsights.primary_insight.savings && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Potential savings:{" "}
                      {weeklyInsights.primary_insight.savings}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Insight */}
          {monthlyInsights?.primary_insight && (
            <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800/40 rounded-lg flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                    This Month
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {monthlyInsights.primary_insight.message}
                  </p>
                  {monthlyInsights.primary_insight.savings && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                      Potential savings:{" "}
                      {monthlyInsights.primary_insight.savings}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time Filter Pills (always visible) */}
      <div className="flex gap-2 flex-wrap items-center">
        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
        {timeFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setTimeFilter(filter.key)}
            className={
              "px-3 py-1.5 rounded-full text-sm transition-colors " +
              (timeFilter === filter.key
                ? "bg-[#22c55e] text-white"
                : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222]")
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range (shown when custom is selected) */}
      {timeFilter === "custom" && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">
              From:
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">
              To:
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
            />
          </div>
          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters (collapsed by default) */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {showAdvanced ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        Category & Search Filters
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  activeFilter === category
                    ? "bg-[#22c55e] text-white"
                    : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No transactions found
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const config =
              categoryConfig[tx.category] || categoryConfig.Shopping;
            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] flex items-center gap-4"
              >
                {/* Category Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                  }}
                >
                  {config.icon}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {tx.name}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      {tx.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(tx.date)} • ₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Carbon */}
                <div className="text-right shrink-0">
                  <p className="font-semibold text-[#22c55e]">
                    {tx.carbon.toFixed(2)} kg
                  </p>
                  <p className="text-xs text-gray-400">CO₂</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
          >
            Prev
          </button>
          <span className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
          >
            Last
          </button>
        </div>
      )}

      {/* Loading overlay for page changes */}
      {isLoading && transactions.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 shadow-lg">
            <div className="w-6 h-6 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Transaction
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTx.name}
                  onChange={(e) => setNewTx({ ...newTx, name: e.target.value })}
                  placeholder="e.g., Uber to Airport"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newTx.category}
                  onChange={(e) =>
                    setNewTx({ ...newTx, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={newTx.amount}
                    onChange={(e) =>
                      setNewTx({ ...newTx, amount: e.target.value })
                    }
                    placeholder="0"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newTx.date}
                    onChange={(e) =>
                      setNewTx({ ...newTx, date: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50"
                >
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
