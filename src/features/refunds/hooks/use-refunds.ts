"use client";

import useSWR from "swr";
import { listRefunds, type RefundListParams } from "../api";

export function useRefunds(params: RefundListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["refunds", params], () => listRefunds(params));

  return { refunds: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}
