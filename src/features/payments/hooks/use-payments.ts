"use client";

import useSWR from "swr";
import { getPayment, listPayments, type PaymentListParams } from "../api";

export function usePayments(params: PaymentListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["payments", params], () => listPayments(params), {
    keepPreviousData: true,
  });

  return { payments: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function usePayment(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id !== "" ? ["payments", id] : null, () => getPayment(id));

  return { payment: data, isLoading, error, mutate };
}
