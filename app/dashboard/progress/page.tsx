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
  Check,
  Calendar,
  Grid3X3,
  Upload,
  Shield,
  Search,
  Star,
  Crown,
  Car,
  Leaf,
  Plane,
  Train,
  Sparkles,
  UtensilsCrossed,
  Home,
  Store,
  Sprout,
  ShoppingBag,
  Minus,
  Tag,
  Clock,
  Zap,
  Lightbulb,
  TrendingDown,
  Flame,
  Medal,
  Trophy,
  ArrowDown,
  Target,
  Globe,
  Rocket,
  BarChart3,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types
interface EmissionTrend {
  period: string;
  current: number;
  previous: number;
  change_percent: number;
  goal: number;
  progress_percent: number;
}

interface Achievement {
  id: string;
  path: string;
  title: string;
  description: string;
  icon_key: string;
  unlocked: boolean;
  unlocked_date?: string;
  progress: number;
  target: number;
  xp: number;
}

interface PathProgress {
  name: string;
  description: string;
  icon: string;
  color: string;
  total: number;
  unlocked: number;
  progress_percent: number;
}

interface Gamification {
  level: number;
  total_xp: number;
  current_level_xp: number;
  next_level_xp: number;
  xp_progress: number;
  achievements_unlocked: number;
  total_achievements: number;
  streak: number;
}

interface ChartData {
  carbon_history: { week: string; date: string; carbon: number }[];
  category_breakdown: { category: string; carbon: number }[];
}

interface ProgressData {
  emission_trends: EmissionTrend[];
  achievements: Achievement[];
  tips: string[];
  paths: Record<string, PathProgress>;
  gamification: Gamification;
  charts: ChartData;
  summary: {
    total_transactions: number;
    this_month_carbon: number;
    monthly_goal: number;
    on_track: boolean;
    total_saved: number;
  };
  motivational_message: string;
}

// Icon components mapping
const icons: Record<string, React.ReactNode> = {
  first_steps: <Check className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  grid: <Grid3X3 className="w-5 h-5" />,
  upload: <Upload className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  search: <Search className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  crown: <Crown className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  leaf: <Leaf className="w-5 h-5" />,
  plane: <Plane className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  sparkle: <Sparkles className="w-5 h-5" />,
  utensils: <UtensilsCrossed className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  store: <Store className="w-5 h-5" />,
  seedling: <Sprout className="w-5 h-5" />,
  bag: <ShoppingBag className="w-5 h-5" />,
  minus: <Minus className="w-5 h-5" />,
  tag: <Tag className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  bolt: <Zap className="w-5 h-5" />,
  lightbulb: <Lightbulb className="w-5 h-5" />,
  trending_down: <TrendingDown className="w-5 h-5" />,
  fire: <Flame className="w-5 h-5" />,
  medal: <Medal className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  arrow_down: <ArrowDown className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  superhero: <Lightbulb className="w-5 h-5" />,
  rocket: <Rocket className="w-5 h-5" />,
  chart: <BarChart3 className="w-5 h-5" />,
  default: <Star className="w-5 h-5" />,
};

// Category colors for charts
const CATEGORY_COLORS: Record<string, string> = {
  Travel: "#3b82f6",
  Food: "#22c55e",
  Shopping: "#f59e0b",
  Electricity: "#eab308",
  Gas: "#f97316",
  Water: "#06b6d4",
  Home: "#ec4899",
};

export default function ProgressPage() {
  const { token, handleUnauthorized } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#22c55e]/30 border-t-[#22c55e] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Failed to load progress data</p>
      </div>
    );
  }

  const filteredAchievements = selectedPath
    ? data.achievements.filter((a) => a.path === selectedPath)
    : data.achievements;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Your Progress
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your sustainability journey and unlock achievements
        </p>
      </div>

      {/* Level & XP Banner */}
      <div className="bg-linear-to-r from-[#22c55e] to-[#16a34a] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {data.gamification.level}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {data.motivational_message}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Level {data.gamification.level} Eco Warrior •{" "}
                {data.gamification.total_xp} XP
              </p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <div className="flex items-center gap-2 text-white/90">
              <Flame className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {data.gamification.streak} day streak
              </span>
            </div>
            <p className="text-white/70 text-sm">
              {data.gamification.achievements_unlocked}/
              {data.gamification.total_achievements} achievements
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-white/80 mb-1">
            <span>Level {data.gamification.level}</span>
            <span>Level {data.gamification.level + 1}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${data.gamification.xp_progress}%` }}
            />
          </div>
          <p className="text-white/70 text-xs mt-1 text-center">
            {data.gamification.next_level_xp - data.gamification.total_xp} XP to
            next level
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="This Month"
          value={`${data.summary.this_month_carbon} kg`}
          subtext={`Goal: ${data.summary.monthly_goal} kg`}
          color={data.summary.on_track ? "#22c55e" : "#ef4444"}
        />
        <StatCard
          label="Transactions"
          value={data.summary.total_transactions.toString()}
          subtext="tracked"
          color="#8b5cf6"
        />
        <StatCard
          label="Streak"
          value={`${data.gamification.streak} days`}
          subtext="keep it going!"
          color="#f59e0b"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carbon History Chart */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Carbon Emissions Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.charts.carbon_history}>
              <defs>
                <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="date"
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
                dataKey="carbon"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#carbonGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Emissions by Category
          </h3>
          {data.charts.category_breakdown.some((c) => c.carbon > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.charts.category_breakdown.filter(
                    (c) => c.carbon > 0
                  )}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="carbon"
                  nameKey="category"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {data.charts.category_breakdown.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value} kg CO₂`, "Emissions"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-62.5 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
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
                <p>No emission data yet</p>
                <p className="text-sm">Add transactions to see breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emission Trends */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Emission Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.emission_trends.map((trend) => (
            <TrendCard key={trend.period} trend={trend} />
          ))}
        </div>
      </div>

      {/* Achievement Paths */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Achievement Paths
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(data.paths).map(([id, path]) => (
            <button
              key={id}
              onClick={() => setSelectedPath(selectedPath === id ? null : id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedPath === id
                  ? "border-2"
                  : "border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]"
              } bg-white dark:bg-[#1a1a1a]`}
              style={{
                borderColor: selectedPath === id ? path.color : undefined,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                style={{
                  backgroundColor: `${path.color}20`,
                  color: path.color,
                }}
              >
                {icons[path.icon] || icons.default}
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {path.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {path.unlocked}/{path.total} unlocked
              </p>
              <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5 mt-2">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${path.progress_percent}%`,
                    backgroundColor: path.color,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {selectedPath
              ? `${data.paths[selectedPath]?.name} Achievements`
              : "All Achievements"}
          </h2>
          {selectedPath && (
            <button
              onClick={() => setSelectedPath(null)}
              className="text-sm text-[#22c55e] hover:underline"
            >
              Show all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              pathColor={data.paths[achievement.path]?.color || "#22c55e"}
            />
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="text-yellow-500">💡</span>
          Tips to Level Up
        </h3>
        <ul className="space-y-2">
          {data.tips.map((tip, index) => (
            <li
              key={index}
              className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2"
            >
              <span className="text-[#22c55e]">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Components
function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}

function TrendCard({ trend }: { trend: EmissionTrend }) {
  const isDown = trend.change_percent < 0;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-gray-900 dark:text-white font-semibold">
            {trend.period}ly
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {trend.current}{" "}
            <span className="text-sm font-normal text-gray-500">kg CO₂</span>
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            isDown
              ? "bg-green-100 dark:bg-green-900/30 text-green-600"
              : "bg-red-100 dark:bg-red-900/30 text-red-600"
          }`}
        >
          {isDown ? "↓" : "↑"} {Math.abs(trend.change_percent)}%
        </span>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Goal: {trend.goal}kg</span>
          <span>{trend.progress_percent}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, trend.progress_percent)}%`,
              backgroundColor:
                trend.progress_percent >= 50 ? "#22c55e" : "#f59e0b",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  pathColor,
}: {
  achievement: Achievement;
  pathColor: string;
}) {
  const progressPercent = (achievement.progress / achievement.target) * 100;

  return (
    <div
      className={`bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border transition-all ${
        achievement.unlocked
          ? "border-gray-200 dark:border-[#2a2a2a]"
          : "border-gray-200 dark:border-[#2a2a2a] opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 relative ${
            achievement.unlocked ? "" : "grayscale"
          }`}
          style={{
            backgroundColor: achievement.unlocked
              ? `${pathColor}20`
              : "#374151",
            color: achievement.unlocked ? pathColor : "#9ca3af",
          }}
        >
          {icons[achievement.icon_key] || icons.default}
          {achievement.unlocked && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: pathColor }}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium text-sm ${
              achievement.unlocked
                ? "text-gray-900 dark:text-white"
                : "text-gray-500"
            }`}
          >
            {achievement.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {!achievement.unlocked && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {achievement.progress}/{achievement.target}
            </span>
            <span>{achievement.xp} XP</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(100, progressPercent)}%`,
                backgroundColor: pathColor,
              }}
            />
          </div>
        </div>
      )}

      {achievement.unlocked && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {achievement.unlocked_date}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: `${pathColor}20`, color: pathColor }}
          >
            +{achievement.xp} XP
          </span>
        </div>
      )}
    </div>
  );
}
