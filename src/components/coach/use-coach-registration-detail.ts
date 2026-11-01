"use client";

import { useMemo } from "react";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

export function useCoachRegistrationDetail({ registrationId }: { registrationId: string }) {
  const { rows, isLoading, error, mutate } = useCoachRegistrationRows();
  const row = useMemo(() => rows.find((item) => item.registration.id === registrationId) ?? null, [rows, registrationId]);

  return { row, isLoading, error, retry: mutate };
}
