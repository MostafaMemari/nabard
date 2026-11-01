"use client";

import useSWR from "swr";
import { listRegistrations } from "@/features/registrations";

export function usePaymentRegistrations(paymentId: string) {
  const { data, error, isLoading, mutate } = useSWR(paymentId !== "" ? ["registrations", "by-payment", paymentId] : null, () =>
    listRegistrations({ paymentId }),
  );

  return {
    registrations: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}
