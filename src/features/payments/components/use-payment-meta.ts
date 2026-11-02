"use client";

import { useCompetitions } from "@/features/competitions";
import { useRegistrations } from "@/features/registrations";
import { useCoaches } from "@/features/users";

export function usePaymentMeta() {
  const { coaches } = useCoaches();
  const { competitions } = useCompetitions();
  const { registrations } = useRegistrations();

  return {
    coachName: (coachId: string) => coaches.find((coach) => coach.id === coachId)?.fullName ?? coachId,
    competitionTitle: (competitionId: string) =>
      competitions.find((competition) => competition.id === competitionId)?.title ?? competitionId,
    studentCount: (paymentId: string) => registrations.filter((registration) => registration.paymentId === paymentId).length,
  };
}
