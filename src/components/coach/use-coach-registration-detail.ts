"use client";

import useSWR from "swr";
import { getRegistrationDetail } from "@/features/registrations";

export function useCoachRegistrationDetail({ registrationId }: { registrationId: string }) {
  const { data, error, isLoading, mutate } = useSWR(registrationId !== "" ? ["registrations", "detail", registrationId] : null, () =>
    getRegistrationDetail(registrationId),
  );

  return { detail: data ?? null, isLoading, error, retry: mutate };
}
