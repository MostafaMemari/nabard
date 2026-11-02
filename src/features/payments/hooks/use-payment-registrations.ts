"use client";

import useSWR from "swr";
import { listRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";

export function usePaymentRegistrations(paymentId: string) {
  const { data, error, isLoading, mutate } = useSWR(paymentId !== "" ? ["registrations", "by-payment", paymentId] : null, () =>
    listRegistrations({ paymentId }),
  );
  const { students, isLoading: studentsLoading } = useStudents();

  return {
    registrations: data?.data ?? [],
    students,
    isLoading: isLoading || studentsLoading,
    error,
    mutate,
  };
}
