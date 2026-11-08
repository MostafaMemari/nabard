"use client";

import useSWR from "swr";
import { getSuperAnalytics } from "../api";

export function useSuperAnalytics(province: string | null) {
  const { data, error, isLoading, mutate } = useSWR(["super-analytics", province], () => getSuperAnalytics(province), {
    keepPreviousData: true,
  });

  return { analytics: data ?? null, isLoading, error, mutate };
}
