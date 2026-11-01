"use client";

import useSWR from "swr";
import { getSuperSummary } from "../api";

export function useSuperSummary() {
  const { data, error, isLoading, mutate } = useSWR("super-summary", () => getSuperSummary());

  return { summary: data ?? null, isLoading, error, mutate };
}
