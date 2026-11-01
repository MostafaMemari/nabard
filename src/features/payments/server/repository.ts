import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { PaymentStatus } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type PaymentRecord = {
  id: string;
  competitionId: string;
  coachId: string;
  amount: string;
  receiptKey: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentWithScope = PaymentRecord & {
  coachProvince: Province;
  competitionDeadline: Date;
};

export type PaymentFilters = {
  coachId?: string;
  province?: Province;
  status?: PaymentStatus;
  competitionId?: string;
};

export type PaymentUpdateData = {
  status?: PaymentStatus;
  note?: string | null;
  receiptKey?: string;
};

export type PaymentTransitionInput = {
  status: "CONFIRMED" | "REJECTED";
  note: string | null;
};

export type PaymentsRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countPayments(filters: PaymentFilters): Promise<number>;
  findPayments(filters: PaymentFilters, skip: number, take: number): Promise<PaymentWithScope[]>;
  findPaymentById(id: string): Promise<PaymentWithScope | null>;
  updatePayment(id: string, data: PaymentUpdateData): Promise<PaymentWithScope>;
  transitionPaymentFromPending(id: string, input: PaymentTransitionInput): Promise<PaymentWithScope | null>;
};

const paymentSelection = {
  id: true,
  competitionId: true,
  coachId: true,
  amount: true,
  receiptKey: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

function paymentWhere(filters: PaymentFilters) {
  return {
    ...(filters.coachId === undefined ? {} : { coachId: filters.coachId }),
    ...(filters.province === undefined ? {} : { coach: { province: filters.province } }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.competitionId === undefined ? {} : { competitionId: filters.competitionId }),
  };
}

function toPaymentRecord(row: {
  id: string;
  competitionId: string;
  coachId: string;
  amount: bigint;
  receiptKey: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentRecord {
  return {
    id: row.id,
    competitionId: row.competitionId,
    coachId: row.coachId,
    amount: row.amount.toString(),
    receiptKey: row.receiptKey,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPaymentWithScope(row: {
  id: string;
  competitionId: string;
  coachId: string;
  amount: bigint;
  receiptKey: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  coach: { province: Province };
  competition: { registrationDeadline: Date };
}): PaymentWithScope {
  return {
    ...toPaymentRecord(row),
    coachProvince: row.coach.province,
    competitionDeadline: row.competition.registrationDeadline,
  };
}

const scopeSelection = {
  ...paymentSelection,
  coach: { select: { province: true } },
  competition: { select: { registrationDeadline: true } },
} as const;

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function countPayments(filters: PaymentFilters): Promise<number> {
  return getPrisma().payment.count({ where: paymentWhere(filters) });
}

export async function findPayments(filters: PaymentFilters, skip: number, take: number): Promise<PaymentWithScope[]> {
  const rows = await getPrisma().payment.findMany({
    where: paymentWhere(filters),
    select: scopeSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map(toPaymentWithScope);
}

export async function findPaymentById(id: string): Promise<PaymentWithScope | null> {
  const row = await getPrisma().payment.findUnique({ where: { id }, select: scopeSelection });

  return row === null ? null : toPaymentWithScope(row);
}

export async function updatePayment(id: string, data: PaymentUpdateData): Promise<PaymentWithScope> {
  const row = await getPrisma().payment.update({ where: { id }, data, select: scopeSelection });

  return toPaymentWithScope(row);
}

export async function transitionPaymentFromPending(id: string, input: PaymentTransitionInput): Promise<PaymentWithScope | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.payment.updateMany({
      where: { id, status: "PENDING" },
      data: { status: input.status, note: input.note },
    });
    if (applied.count === 0) return null;

    const row = await tx.payment.findUnique({ where: { id }, select: scopeSelection });

    return row === null ? null : toPaymentWithScope(row);
  });
}
