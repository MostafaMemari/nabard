"use client";

import useSWR from "swr";
import { listPayments, type PaymentListParams } from "../api";

export function usePayments(params: PaymentListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["payments", params], () => listPayments(params));

  return { payments: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}
