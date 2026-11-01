import type { Discipline } from "@/features/competitions";
import type { PaymentStatus } from "@/features/payments";
import type { RefundStatus } from "@/features/refunds";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { SummaryPendingPayment, SummaryUpcomingCompetition } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type SummaryRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countPayments(province: Province, status: PaymentStatus): Promise<number>;
  countOpenCompetitions(province: Province): Promise<number>;
  countRegistrationsSince(province: Province, since: Date): Promise<number>;
  countRefunds(province: Province, status: RefundStatus): Promise<number>;
  countPendingProfiles(province: Province): Promise<number>;
  countPendingCountyChanges(province: Province): Promise<number>;
  findLatestPendingPayments(province: Province, take?: number): Promise<SummaryPendingPayment[]>;
  findUpcomingCompetitions(province: Province, take?: number): Promise<SummaryUpcomingCompetition[]>;
};

const LATEST_PAYMENTS_LIMIT = 5;
const UPCOMING_LIMIT = 5;

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function countPayments(province: Province, status: PaymentStatus): Promise<number> {
  return getPrisma().payment.count({ where: { status, coach: { province } } });
}

export async function countOpenCompetitions(province: Province): Promise<number> {
  return getPrisma().competition.count({ where: { status: "PUBLISHED", province } });
}

export async function countRegistrationsSince(province: Province, since: Date): Promise<number> {
  return getPrisma().registration.count({ where: { createdAt: { gte: since }, coach: { province } } });
}

export async function countRefunds(province: Province, status: RefundStatus): Promise<number> {
  return getPrisma().refund.count({ where: { status, coach: { province } } });
}

export async function countPendingProfiles(province: Province): Promise<number> {
  return getPrisma().student.count({ where: { profileStatus: "PENDING", coach: { province } } });
}

export async function countPendingCountyChanges(province: Province): Promise<number> {
  return getPrisma().coachCountyChangeRequest.count({ where: { status: "PENDING", coach: { province } } });
}

export async function findLatestPendingPayments(
  province: Province,
  take: number = LATEST_PAYMENTS_LIMIT,
): Promise<SummaryPendingPayment[]> {
  const rows = await getPrisma().payment.findMany({
    where: { status: "PENDING", coach: { province } },
    select: { id: true, amount: true, createdAt: true, coach: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount.toString(),
    createdAt: row.createdAt.toISOString(),
    coachId: row.coach.id,
    coachName: row.coach.fullName,
  }));
}

export async function findUpcomingCompetitions(province: Province, take: number = UPCOMING_LIMIT): Promise<SummaryUpcomingCompetition[]> {
  const rows = await getPrisma().competition.findMany({
    where: { status: "PUBLISHED", province },
    select: {
      id: true,
      title: true,
      discipline: true,
      registrationDeadline: true,
      _count: { select: { registrations: true } },
    },
    orderBy: { registrationDeadline: "asc" },
    take,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    discipline: row.discipline as Discipline,
    registrationDeadline: row.registrationDeadline.toISOString(),
    registrationsCount: row._count.registrations,
  }));
}
