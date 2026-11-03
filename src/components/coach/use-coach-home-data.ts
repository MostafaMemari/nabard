"use client";

import { useMemo } from "react";
import { useCompetitions } from "@/features/competitions";
import { usePayments } from "@/features/payments";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

function isRegistrationOpen(deadline: string, now: Date): boolean {
  return new Date(deadline).getTime() >= now.getTime();
}

export function useCoachHomeData() {
  const {
    competitions,
    isLoading: competitionsLoading,
    error: competitionsError,
    mutate: retryCompetitions,
  } = useCompetitions({ status: "PUBLISHED" });
  const { rows, isLoading: registrationsLoading, error: registrationsError, mutate: retryRegistrations } = useCoachRegistrationRows();
  const { payments, isLoading: paymentsLoading } = usePayments();

  const openCompetitions = useMemo(
    () => competitions.filter((competition) => isRegistrationOpen(competition.registrationDeadline, new Date())),
    [competitions],
  );

  return {
    openCompetitions,
    recentRows: rows.slice(0, 5),
    registrationsCount: rows.length,
    awaitingReview: payments.filter((payment) => payment.status === "PENDING").length,
    isLoading: competitionsLoading || registrationsLoading || paymentsLoading,
    competitionsLoading,
    competitionsError,
    retryCompetitions: () => void retryCompetitions(),
    registrationsLoading,
    registrationsError,
    retryRegistrations: () => void retryRegistrations(),
  };
}
