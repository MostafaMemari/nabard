"use client";

import useSWR from "swr";
import { listPendingReview } from "../api";

export function usePendingReview() {
  const { data, error, isLoading, mutate } = useSWR("students-pending-review", () => listPendingReview({ pageSize: 100 }));

  return { students: data?.data ?? [], isLoading, error, mutate };
}
