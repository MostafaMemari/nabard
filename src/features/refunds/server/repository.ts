import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { RefundReason, RefundStatus } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type RefundRecord = {
  id: string;
  registrationId: string;
  coachId: string;
  coachName: string;
  studentName: string;
  competitionId: string;
  competitionTitle: string;
  amount: string;
  reason: RefundReason;
  status: RefundStatus;
  note: string | null;
  processedAt: Date | null;
  createdAt: Date;
};

export type RefundWithScope = RefundRecord & {
  coachProvince: Province;
};

export type RefundFilters = {
  province?: Province;
  coachId?: string;
  status?: RefundStatus;
};

export type CompleteRefundInput = {
  processedById: string;
  note: string | null;
};

export type RefundsRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countRefunds(filters: RefundFilters): Promise<number>;
  findRefunds(filters: RefundFilters, skip: number, take: number): Promise<RefundWithScope[]>;
  findRefundById(id: string): Promise<RefundWithScope | null>;
  completeRefundFromPending(id: string, input: CompleteRefundInput): Promise<RefundWithScope | null>;
};

const refundSelection = {
  id: true,
  registrationId: true,
  coachId: true,
  amount: true,
  reason: true,
  status: true,
  note: true,
  processedAt: true,
  createdAt: true,
  coach: { select: { province: true, fullName: true } },
  registration: {
    select: {
      student: { select: { fullName: true } },
      competition: { select: { id: true, title: true } },
    },
  },
} as const;

type RefundRowInput = {
  id: string;
  registrationId: string;
  coachId: string;
  amount: bigint;
  reason: RefundReason;
  status: RefundStatus;
  note: string | null;
  processedAt: Date | null;
  createdAt: Date;
  coach: { province: Province; fullName: string };
  registration: {
    student: { fullName: string };
    competition: { id: string; title: string };
  };
};

function toRefundRecord(row: RefundRowInput): RefundRecord {
  return {
    id: row.id,
    registrationId: row.registrationId,
    coachId: row.coachId,
    coachName: row.coach.fullName,
    studentName: row.registration.student.fullName,
    competitionId: row.registration.competition.id,
    competitionTitle: row.registration.competition.title,
    amount: row.amount.toString(),
    reason: row.reason,
    status: row.status,
    note: row.note,
    processedAt: row.processedAt,
    createdAt: row.createdAt,
  };
}

function refundWhere(filters: RefundFilters) {
  return {
    ...(filters.coachId === undefined ? {} : { coachId: filters.coachId }),
    ...(filters.province === undefined ? {} : { coach: { province: filters.province } }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function countRefunds(filters: RefundFilters): Promise<number> {
  return getPrisma().refund.count({ where: refundWhere(filters) });
}

export async function findRefunds(filters: RefundFilters, skip: number, take: number): Promise<RefundWithScope[]> {
  const rows = await getPrisma().refund.findMany({
    where: refundWhere(filters),
    select: refundSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map((row) => ({ ...toRefundRecord(row), coachProvince: row.coach.province }));
}

export async function findRefundById(id: string): Promise<RefundWithScope | null> {
  const row = await getPrisma().refund.findUnique({ where: { id }, select: refundSelection });

  return row === null ? null : { ...toRefundRecord(row), coachProvince: row.coach.province };
}

export async function completeRefundFromPending(id: string, input: CompleteRefundInput): Promise<RefundWithScope | null> {
  const applied = await getPrisma().refund.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "COMPLETED", processedById: input.processedById, processedAt: new Date(), note: input.note },
  });
  if (applied.count === 0) return null;

  const row = await getPrisma().refund.findUnique({ where: { id }, select: refundSelection });

  return row === null ? null : { ...toRefundRecord(row), coachProvince: row.coach.province };
}
