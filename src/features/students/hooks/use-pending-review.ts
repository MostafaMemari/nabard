"use client";

import useSWR from "swr";
import { listRegistrationRequests } from "../api";

// Admin review list: the province's registration requests that still need an
// action (pending by default, rejected reachable through the tabs).
export function usePendingReview() {
  const { data, error, isLoading, mutate } = useSWR("registration-requests-review", () => listRegistrationRequests({ pageSize: 100 }));

  return { students: data?.data ?? [], isLoading, error, mutate };
}
