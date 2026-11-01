import type { Discipline } from "@/features/competitions";

export type SummaryPendingPayment = {
  id: string;
  amount: string;
  createdAt: string;
  coachId: string;
  coachName: string;
};

export type SummaryUpcomingCompetition = {
  id: string;
  title: string;
  discipline: Discipline;
  registrationDeadline: string;
  registrationsCount: number;
};

export type AdminSummary = {
  pendingPaymentsCount: number;
  openCompetitionsCount: number;
  weeklyRegistrationsCount: number;
  pendingRefundsCount: number;
  pendingProfilesCount: number;
  latestPendingPayments: SummaryPendingPayment[];
  upcomingCompetitions: SummaryUpcomingCompetition[];
};
