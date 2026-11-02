"use client";

import { useMemo } from "react";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

export function useCoachRegistrationDetail({ coachId, registrationId }: { coachId: string; registrationId: string }) {
  const { rows, isLoading, error, mutate } = useCoachRegistrationRows(coachId);
  const row = useMemo(() => rows.find((item) => item.registration.id === registrationId) ?? null, [rows, registrationId]);

  return { row, isLoading, error, retry: mutate };
}
