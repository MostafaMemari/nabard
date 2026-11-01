"use client";

import useSWR from "swr";
import { listCounties } from "../api";

export function useCounties() {
  const { data, error, isLoading } = useSWR("counties", () => listCounties());

  return { counties: data ?? [], isLoading, error };
}
