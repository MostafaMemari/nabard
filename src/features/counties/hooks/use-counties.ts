"use client";

import useSWR from "swr";
import { type CountyListParams, listCounties } from "../api";

export function useCounties(params: CountyListParams = {}) {
  const key = ["counties", params.province ?? null];
  const { data, error, isLoading, mutate } = useSWR(key, () => listCounties(params));

  return { counties: data ?? [], isLoading, error, mutate };
}
