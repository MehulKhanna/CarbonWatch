// ===========================================
// Carbon Watch - React Query Hooks
// ===========================================
// These hooks wrap the API calls with React Query for
// caching, loading states, and automatic refetching.
//
// To use these hooks, first install react-query:
// npm install @tanstack/react-query
//
// Then wrap your app with QueryClientProvider in layout.tsx

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dashboardApi,
  transactionsApi,
  insightsApi,
  progressApi,
  authApi,
} from "./api";
import type {
  TransactionFilters,
  TransactionCreate,
  GoalCreate,
} from "./types";

// ===========================================
// Query Keys
// ===========================================
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  transactions: (filters?: TransactionFilters) =>
    ["transactions", filters] as const,
  transaction: (id: string) => ["transaction", id] as const,
  insights: ["insights"] as const,
  progress: ["progress"] as const,
  goals: ["goals"] as const,
  profile: ["profile"] as const,
};

// ===========================================
// Dashboard Hooks
// ===========================================
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardApi.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ===========================================
// Transaction Hooks
// ===========================================
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => transactionsApi.getAll(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionCreate) => transactionsApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch transactions and dashboard
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TransactionCreate>;
    }) => transactionsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transaction(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ===========================================
// Insights Hooks
// ===========================================
export function useInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () => insightsApi.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => insightsApi.dismissRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insights });
    },
  });
}

// ===========================================
// Progress Hooks
// ===========================================
export function useProgress() {
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: () => progressApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => progressApi.getGoals(),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GoalCreate) => progressApi.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalCreate> }) =>
      progressApi.updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => progressApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
}

// ===========================================
// Auth Hooks
// ===========================================
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => authApi.getProfile(),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
