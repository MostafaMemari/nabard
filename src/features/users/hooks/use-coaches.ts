"use client";

import useSWR from "swr";
import { type CoachListParams, listCoaches } from "../api";

export function useCoaches(params: CoachListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["users", "coaches", params], () => listCoaches(params));

  return { coaches: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}
