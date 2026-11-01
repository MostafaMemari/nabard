"use client";

import useSWR from "swr";
import { getSummary } from "../api";

export function useSummary() {
  const { data, error, isLoading, mutate } = useSWR("summary", () => getSummary());

  return { summary: data ?? null, isLoading, error, mutate };
}
