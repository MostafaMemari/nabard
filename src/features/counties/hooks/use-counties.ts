"use client";

import useSWR from "swr";
import { listCounties } from "../api";

export function useCounties() {
  const { data, error, isLoading, mutate } = useSWR("counties", () => listCounties());

  return { counties: data ?? [], isLoading, error, mutate };
}
