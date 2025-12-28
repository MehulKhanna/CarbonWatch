"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { onTransactionsUpdated } from "@/lib/events";
import Link from "next/link";
import {
  AreaChart,
  Area,
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
  TrendingDown,
  TrendingUp,
  Lightbulb,
  Trophy,
  ArrowRight,
  FileText,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface DashboardStats {
  totalCarbon: number;
  monthlyChange: number;
  highestImpact: { category: string; percentage: number };
}

interface TrendData {
  month: string;
  value: number;
}

interface Insight {
  id: string;
  category: string;
  title: string;
  tip: string;
  potential_savings: string;
}

interface PrimaryInsight {
  category: string;
  message: string;
  savings: string;
  encouragement: string;
}

interface GamificationData {
  days_tracked: number;
  imports: number;
  level: number;
  title: string;
  xp: number;
  next_reward: {
    name: string;
    icon: string;
    xp_needed: number;
  } | null;
  motivation: string;
}

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
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [primaryInsight, setPrimaryInsight] = useState<PrimaryInsight | null>(
    null
  );
  const [gamification, setGamification] = useState<GamificationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const dashboardRes = await fetch(API_URL + "/dashboard", {
        headers: { Authorization: "Bearer " + token },
      });

      if (dashboardRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        const statsData = data.stats || {};

        setStats({
          totalCarbon: Math.round((statsData.totalCarbon || 0) * 100) / 100,
          monthlyChange: Math.round((statsData.monthlyChange || 0) * 100) / 100,
          highestImpact: {
            category: statsData.highestImpact?.category || "N/A",
            percentage: Math.round(statsData.highestImpact?.percentage || 0),
          },
        });

        const trend = (data.trendData || []).map(
          (item: { month: string; value: number }) => ({
            month: item.month,
            value: Math.round((item.value || 0) * 100) / 100,
          })
        );
        setTrendData(trend);
      }

      const insightsRes = await fetch(API_URL + "/insights", {
        headers: { Authorization: "Bearer " + token },
      });

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();

        // Set primary insight for the suggestions card
        if (insightsData.primary_insight) {
          setPrimaryInsight(insightsData.primary_insight);
        }

        // Set actionable tips
        const tips =
          insightsData.recommendations || insightsData.personalized_tips || [];
        setInsights(
          tips.slice(0, 2).map(
            (
              tip: {
                id?: string;
                category: string;
                title: string;
                tip: string;
                potential_savings: string;
              },
              i: number
            ) => ({
              id: tip.id || String(i),
              category: tip.category,
              title: tip.title,
              tip: tip.tip,
              potential_savings: tip.potential_savings,
            })
          )
        );
      }

      const progressRes = await fetch(API_URL + "/progress", {
        headers: { Authorization: "Bearer " + token },
      });

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        if (progressData.gamification) {
          setGamification(progressData.gamification);
        }
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

  // Listen for transaction updates from other pages (e.g., deletes on details page)
  useEffect(() => {
    return onTransactionsUpdated(() => {
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(API_URL + "/transactions/import", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
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
            data.message || "Imported " + data.imported_count + " transactions",
        });
        fetchDashboardData();
      } else {
        setUploadResult({
          success: false,
          message: data.detail || "Failed to import transactions",
        });
      }
    } catch {
      setUploadResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsUploading(false);
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
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = stats.totalCarbon > 0 || trendData.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Upload Section */}
      <section className="bg-linear-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-8 text-white">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {hasData
              ? "Upload More Transactions"
              : "Upload Your Bank Statement"}
          </h1>
          <p className="text-white/80">
            {hasData
              ? "Add more data to get better insights"
              : "Drop your CSV or Excel file to instantly see your carbon impact"}
          </p>
        </div>

        <div
          className={
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all " +
            (dragActive
              ? "border-white bg-white/20"
              : "border-white/40 hover:border-white/60 bg-white/10")
          }
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

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p>Processing your file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  Drag and drop your file here
                </p>
                <p className="text-white/70 text-sm mt-1">
                  or click to browse • CSV, XLS, XLSX
                </p>
              </div>
            </div>
          )}
        </div>

        {uploadResult && (
          <div
            className={
              "mt-4 p-4 rounded-lg text-center transition-all duration-300 " +
              (uploadResult.success
                ? "bg-white/20 animate-pulse"
                : "bg-red-500/30")
            }
          >
            {uploadResult.success && <span className="mr-2">🎉</span>}
            {uploadResult.message}
            {uploadResult.success && (
              <p className="text-sm mt-1 text-white/80">
                Your impact is now visible below!
              </p>
            )}
          </div>
        )}
      </section>

      {/* Key Metrics */}
      {hasData && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-all duration-200">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
              This Month
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalCarbon}{" "}
              <span className="text-lg font-normal text-gray-500">kg CO₂</span>
            </p>
            <div
              className={
                "flex items-center gap-1 mt-2 text-sm " +
                (stats.monthlyChange < 0 ? "text-[#22c55e]" : "text-red-500")
              }
            >
              {stats.monthlyChange < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span>{Math.abs(stats.monthlyChange)}% vs last month</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-all duration-200">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
              Highest Impact
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#22c55e]/10 rounded-lg flex items-center justify-center text-[#22c55e]">
                {categoryIcons[stats.highestImpact.category] || (
                  <ShoppingBag className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.highestImpact.category}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.highestImpact.percentage}% of emissions
                </p>
              </div>
            </div>
          </div>

          {/* Progress Card - Enhanced */}
          <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800/30">
            <p className="text-amber-700 dark:text-amber-400 text-sm mb-2 font-medium">
              Your Journey
            </p>
            {gamification ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {gamification.title || `Level ${gamification.level}`}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      📊 {gamification.days_tracked} days tracked
                    </p>
                  </div>
                </div>
                {gamification.next_reward && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
                    <span className="mr-1">
                      {gamification.next_reward.icon}
                    </span>
                    <span className="font-medium">
                      {gamification.next_reward.xp_needed} XP
                    </span>{" "}
                    to unlock {gamification.next_reward.name}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                Start tracking to earn badges! 🌱
              </p>
            )}
          </div>
        </section>
      )}

      {/* Suggestions Card - Primary Insight */}
      {hasData && primaryInsight && (
        <section className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  💡 Your Top Suggestion
                </p>
                <span className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  {primaryInsight.category}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {primaryInsight.message}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  Potential savings: {primaryInsight.savings}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {primaryInsight.encouragement}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trend Chart */}
      {hasData && trendData.length > 0 && (
        <section className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Emissions Over Time
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Your carbon footprint trend
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
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
                opacity={0.2}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151", opacity: 0.3 }}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151", opacity: 0.3 }}
                tickFormatter={(value) => value + "kg"}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [value + " kg CO₂", "Emissions"]}
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
        </section>
      )}

      {/* Top Insights */}
      {hasData && insights.length > 0 && (
        <section className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[#22c55e]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Wins
            </h2>
          </div>

          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#111] rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="w-8 h-8 bg-[#22c55e]/10 rounded-lg flex items-center justify-center shrink-0 text-[#22c55e]">
                  {categoryIcons[insight.category] || (
                    <Lightbulb className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {insight.title}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                    {insight.tip}
                  </p>
                  {insight.potential_savings && (
                    <p className="text-[#22c55e] text-xs mt-1 font-medium">
                      ✨ Save {insight.potential_savings}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* View Details Link */}
      {hasData && (
        <div className="text-center space-y-3">
          <Link
            href="/dashboard/details"
            className="inline-flex items-center gap-2 text-[#22c55e] hover:text-[#16a34a] font-medium transition-all duration-200 hover:gap-3 group"
          >
            <FileText className="w-4 h-4" />
            View All Transactions & Details
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      {/* Subtle footer link to offset resources */}
      <div className="text-center pt-8 pb-4 border-t border-gray-100 dark:border-[#2a2a2a]">
        <Link
          href="/dashboard/offset"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          Learn about climate action & carbon offsetting →
        </Link>
      </div>

      {/* Empty State */}
      {!hasData && (
        <section className="text-center py-12">
          <div className="w-20 h-20 bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🌱</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ready to make an impact?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            Upload your bank statement above and we&apos;ll show you exactly
            where your carbon footprint comes from — plus simple ways to reduce
            it.
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            It only takes 30 seconds ⚡
          </p>
        </section>
      )}
    </div>
  );
}
