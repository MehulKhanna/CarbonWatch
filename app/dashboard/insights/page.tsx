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
  Info,
  Lightbulb,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types for API
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  tip: string;
  potentialSavings: string;
  priority: "high" | "medium" | "low";
  category:
    | "Travel"
    | "Food"
    | "Shopping"
    | "Electricity"
    | "Gas"
    | "Water"
    | "Home";
}

export interface InsightsData {
  potentialMonthlySavings: number;
  recommendations: Recommendation[];
}

const categoryConfig: Record<
  string,
  { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  Travel: {
    color: "#22c55e",
    bgColor: "#22c55e10",
    borderColor: "#22c55e40",
    icon: <Plane className="w-5 h-5" />,
  },
  Food: {
    color: "#f59e0b",
    bgColor: "#f59e0b10",
    borderColor: "#f59e0b40",
    icon: <UtensilsCrossed className="w-5 h-5" />,
  },
  Shopping: {
    color: "#a855f7",
    bgColor: "#a855f710",
    borderColor: "#a855f740",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  Electricity: {
    color: "#eab308",
    bgColor: "#eab30810",
    borderColor: "#eab30840",
    icon: <Zap className="w-5 h-5" />,
  },
  Gas: {
    color: "#f97316",
    bgColor: "#f9731610",
    borderColor: "#f9731640",
    icon: <Flame className="w-5 h-5" />,
  },
  Water: {
    color: "#06b6d4",
    bgColor: "#06b6d410",
    borderColor: "#06b6d440",
    icon: <Droplets className="w-5 h-5" />,
  },
  Home: {
    color: "#ec4899",
    bgColor: "#ec489910",
    borderColor: "#ec489940",
    icon: <Home className="w-5 h-5" />,
  },
  General: {
    color: "#6b7280",
    bgColor: "#6b728010",
    borderColor: "#6b728040",
    icon: <Info className="w-5 h-5" />,
  },
};

const defaultConfig = {
  color: "#6b7280",
  bgColor: "#6b728010",
  borderColor: "#6b728040",
  icon: <Info className="w-5 h-5" />,
};

export default function InsightsPage() {
  const { token, handleUnauthorized } = useAuth();
  const [insights, setInsights] = useState<InsightsData>({
    potentialMonthlySavings: 0,
    recommendations: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/insights`, {
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
        // Transform API response to component format
        const recommendations: Recommendation[] = (
          data.recommendations || []
        ).map(
          (
            rec: {
              id: string;
              title: string;
              description: string;
              tip: string;
              potential_savings: string;
              priority: "high" | "medium" | "low";
              category: string;
            },
            index: number
          ) => ({
            id: rec.id || String(index + 1),
            title: rec.title,
            description: rec.description,
            tip: rec.tip,
            potentialSavings: rec.potential_savings,
            priority: rec.priority,
            category: rec.category,
          })
        );

        setInsights({
          potentialMonthlySavings: data.potential_monthly_savings || 0,
          recommendations,
        });
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const highPriority = insights.recommendations.filter(
    (r) => r.priority === "high"
  );
  const otherOpportunities = insights.recommendations.filter(
    (r) => r.priority !== "high"
  );

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Insights & Suggestions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Personalized recommendations to reduce your carbon footprint
        </p>
      </div>

      {/* Potential Savings Banner */}
      <div className="bg-[#22c55e]/10 dark:bg-[#22c55e]/5 rounded-xl p-6 border border-[#22c55e]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Potential Monthly Savings
            </p>
            <p className="text-2xl font-semibold text-[#22c55e]">
              Up to {insights.potentialMonthlySavings} kg CO₂
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              by following all recommendations below
            </p>
          </div>
        </div>
      </div>

      {/* High Priority */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#ef4444] rounded-full"></div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            High Priority
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {highPriority.map((rec) => {
            const config = categoryConfig[rec.category] || defaultConfig;
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border-l-4"
                style={{
                  borderLeftColor: config.color,
                  borderTopColor: "#2a2a2a",
                  borderRightColor: "#2a2a2a",
                  borderBottomColor: "#2a2a2a",
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rec.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      {rec.description}
                    </p>
                  </div>
                </div>
                <div className="pl-13 ml-13 space-y-2">
                  <p
                    className="text-sm flex items-center gap-2 font-medium"
                    style={{ color: config.color }}
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    {rec.potentialSavings}
                  </p>
                  <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                    <p className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <span>
                        <strong>Tip:</strong> {rec.tip}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Opportunities */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Other Opportunities
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {otherOpportunities.map((rec) => {
            const config = categoryConfig[rec.category] || defaultConfig;
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border-l-4"
                style={{
                  borderLeftColor: config.color,
                  borderTopColor: "#2a2a2a",
                  borderRightColor: "#2a2a2a",
                  borderBottomColor: "#2a2a2a",
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rec.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      {rec.description}
                    </p>
                  </div>
                </div>
                <div className="pl-13 ml-13 space-y-2">
                  <p
                    className="text-sm flex items-center gap-2 font-medium"
                    style={{ color: config.color }}
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    {rec.potentialSavings}
                  </p>
                  <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                    <p className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <span>
                        <strong>Tip:</strong> {rec.tip}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
