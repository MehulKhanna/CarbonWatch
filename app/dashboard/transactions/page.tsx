"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  Plane,
  UtensilsCrossed,
  ShoppingBag,
  Zap,
  Flame,
  Droplets,
  Home,
  Search,
  Trash2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types for API
export interface Transaction {
  id: string;
  name: string;
  description?: string;
  category:
    | "Travel"
    | "Food"
    | "Shopping"
    | "Electricity"
    | "Gas"
    | "Water"
    | "Home";
  date: string;
  amount: number;
  carbon: number;
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

export default function TransactionsPage() {
  const { token, handleUnauthorized } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "All") {
        params.append("category", activeFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      params.append("page_size", "100"); // Get more transactions

      const response = await fetch(`${API_URL}/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        setTransactions(data.transactions || data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, activeFilter, searchQuery, handleUnauthorized]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchTransactions]);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredTransactions = transactions;

  const totalEmissions = filteredTransactions.reduce(
    (sum, tx) => sum + tx.carbon,
    0
  );

  const totalSpent = filteredTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Transactions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View your spending and associated carbon emissions
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Showing {filteredTransactions.length} transactions
            </p>
            <p className="text-gray-900 dark:text-white font-semibold">
              Total emissions:{" "}
              <span className="text-[#22c55e]">
                {totalEmissions.toFixed(2)} kg CO₂
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Total spent
            </p>
            <p className="text-gray-900 dark:text-white font-semibold">
              ₹
              {totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === category
                ? "bg-[#22c55e] text-white"
                : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#222]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No transactions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Add your first transaction or import from your bank statement
          </p>
        </div>
      ) : (
        /* Transactions List */
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const config =
              categoryConfig[tx.category] || categoryConfig.Shopping;
            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tx.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    {tx.category}
                  </span>
                  <div className="text-right min-w-25">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹
                      {tx.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm" style={{ color: config.color }}>
                      {tx.carbon.toFixed(2)} kg CO₂
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete transaction"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
