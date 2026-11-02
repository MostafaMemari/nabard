"use client";

import useSWR from "swr";
import { type CoachListParams, getCoach, listCoaches } from "../api";

export function useCoaches(params: CoachListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["users", "coaches", params], () => listCoaches(params), {
    keepPreviousData: true,
  });

  return { coaches: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useCoach(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id !== "" ? ["users", "coaches", id] : null, () => getCoach(id));

  return { coach: data, isLoading, error, mutate };
}
