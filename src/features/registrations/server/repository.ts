import type { AgeCategoryName, Belt, Gender, WeightClass } from "@/features/base-data";
import type { CompetitionStatus, Discipline } from "@/features/competitions";
import type { PaymentStatus } from "@/features/payments";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { RegistrationStatus } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type RegistrationRecord = {
  id: string;
  competitionId: string;
  studentId: string;
  coachId: string;
  paymentId: string | null;
  weightClassId: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RegistrationWithScope = RegistrationRecord & {
  coachProvince: Province;
  paymentStatus: PaymentStatus | null;
};

export type RegistrationFilters = {
  coachId?: string;
  province?: Province;
  competitionId?: string;
  paymentId?: string;
  status?: RegistrationStatus;
};

export type CompetitionRegistrationRow = {
  id: string;
  province: Province;
  status: CompetitionStatus;
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  minBeltId: string;
  maxBeltId: string;
  feePerStudent: bigint;
  registrationDeadline: Date;
  createdAt: Date;
};

export type AgeCategoryRow = {
  id: string;
  name: AgeCategoryName;
  startDate: Date;
  endDate: Date;
};

export type RegistrationStudentRow = {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate: Date;
  beltId: string;
  weightKg: number | null;
};

export type RegistrationBundleInput = {
  competitionId: string;
  coachId: string;
  amount: bigint;
  receiptKey: string;
  students: Array<{ studentId: string; weightClassId: string | null }>;
};

export type RegistrationBundle = {
  payment: {
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
  registrations: RegistrationRecord[];
};

export type RegistrationRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findCompetitionById(id: string): Promise<CompetitionRegistrationRow | null>;
  findAgeCategoryById(id: string): Promise<AgeCategoryRow | null>;
  findCoachStudentsByIds(coachId: string, studentIds: string[]): Promise<RegistrationStudentRow[]>;
  findAllBelts(): Promise<Belt[]>;
  findWeightClasses(ageCategoryId: string, gender: Gender): Promise<WeightClass[]>;
  findRegisteredStudentIds(competitionId: string, studentIds: string[]): Promise<string[]>;
  countRegistrations(filters: RegistrationFilters): Promise<number>;
  findRegistrations(filters: RegistrationFilters, skip: number, take: number): Promise<RegistrationWithScope[]>;
  findRegistrationById(id: string): Promise<RegistrationWithScope | null>;
  createRegistrationBundle(input: RegistrationBundleInput): Promise<RegistrationBundle>;
  updateRegistration(id: string, data: { status?: RegistrationStatus; note?: string | null }): Promise<RegistrationWithScope>;
};

const registrationSelection = {
  id: true,
  competitionId: true,
  studentId: true,
  coachId: true,
  paymentId: true,
  weightClassId: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toRegistrationRecord(row: {
  id: string;
  competitionId: string;
  studentId: string;
  coachId: string;
  paymentId: string | null;
  weightClassId: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RegistrationRecord {
  return {
    id: row.id,
    competitionId: row.competitionId,
    studentId: row.studentId,
    coachId: row.coachId,
    paymentId: row.paymentId,
    weightClassId: row.weightClassId,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function registrationWhere(filters: RegistrationFilters) {
  return {
    ...(filters.coachId === undefined ? {} : { coachId: filters.coachId }),
    ...(filters.province === undefined ? {} : { coach: { province: filters.province } }),
    ...(filters.competitionId === undefined ? {} : { competitionId: filters.competitionId }),
    ...(filters.paymentId === undefined ? {} : { paymentId: filters.paymentId }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function findCompetitionById(id: string): Promise<CompetitionRegistrationRow | null> {
  return getPrisma().competition.findUnique({
    where: { id },
    select: {
      id: true,
      province: true,
      status: true,
      discipline: true,
      gender: true,
      ageCategoryId: true,
      minBeltId: true,
      maxBeltId: true,
      feePerStudent: true,
      registrationDeadline: true,
      createdAt: true,
    },
  });
}

export async function findAgeCategoryById(id: string): Promise<AgeCategoryRow | null> {
  return getPrisma().ageCategory.findUnique({
    where: { id },
    select: { id: true, name: true, startDate: true, endDate: true },
  });
}

export async function findCoachStudentsByIds(coachId: string, studentIds: string[]): Promise<RegistrationStudentRow[]> {
  const rows = await getPrisma().student.findMany({
    where: { coachId, id: { in: studentIds } },
    select: { id: true, fullName: true, gender: true, birthDate: true, beltId: true, weightKg: true },
  });

  return rows.map((row) => ({ ...row, weightKg: row.weightKg === null ? null : Number(row.weightKg) }));
}

export async function findAllBelts(): Promise<Belt[]> {
  return getPrisma().belt.findMany({ orderBy: { level: "asc" } });
}

export async function findWeightClasses(ageCategoryId: string, gender: Gender): Promise<WeightClass[]> {
  const rows = await getPrisma().weightClass.findMany({ where: { ageCategoryId, gender }, orderBy: { order: "asc" } });

  return rows.map((row) => ({
    id: row.id,
    ageCategoryId: row.ageCategoryId,
    gender: row.gender,
    label: row.label,
    minWeightKg: Number(row.minWeightKg),
    maxWeightKg: row.maxWeightKg === null ? null : Number(row.maxWeightKg),
    order: row.order,
    excludeMin: row.excludeMin,
    excludeMax: row.excludeMax,
  }));
}

export async function findRegisteredStudentIds(competitionId: string, studentIds: string[]): Promise<string[]> {
  const rows = await getPrisma().registration.findMany({
    where: { competitionId, studentId: { in: studentIds } },
    select: { studentId: true },
  });

  return rows.map((row) => row.studentId);
}

export async function countRegistrations(filters: RegistrationFilters): Promise<number> {
  return getPrisma().registration.count({ where: registrationWhere(filters) });
}

export async function findRegistrations(filters: RegistrationFilters, skip: number, take: number): Promise<RegistrationWithScope[]> {
  const rows = await getPrisma().registration.findMany({
    where: registrationWhere(filters),
    select: { ...registrationSelection, coach: { select: { province: true } }, payment: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map((row) => ({
    ...toRegistrationRecord(row),
    coachProvince: row.coach.province,
    paymentStatus: row.payment?.status ?? null,
  }));
}

export async function findRegistrationById(id: string): Promise<RegistrationWithScope | null> {
  const row = await getPrisma().registration.findUnique({
    where: { id },
    select: { ...registrationSelection, coach: { select: { province: true } }, payment: { select: { status: true } } },
  });

  return row === null
    ? null
    : { ...toRegistrationRecord(row), coachProvince: row.coach.province, paymentStatus: row.payment?.status ?? null };
}

export async function createRegistrationBundle(input: RegistrationBundleInput): Promise<RegistrationBundle> {
  return getPrisma().$transaction(async (tx) => {
    const paymentRow = await tx.payment.create({
      data: {
        competitionId: input.competitionId,
        coachId: input.coachId,
        amount: input.amount,
        receiptKey: input.receiptKey,
        status: "PENDING",
      },
      select: {
        id: true,
        competitionId: true,
        coachId: true,
        amount: true,
        receiptKey: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const registrations: RegistrationRecord[] = [];
    for (const student of input.students) {
      const row = await tx.registration.create({
        data: {
          competitionId: input.competitionId,
          studentId: student.studentId,
          coachId: input.coachId,
          paymentId: paymentRow.id,
          weightClassId: student.weightClassId,
          status: "PENDING",
        },
        select: registrationSelection,
      });
      registrations.push(toRegistrationRecord(row));
    }

    return {
      payment: {
        id: paymentRow.id,
        competitionId: paymentRow.competitionId,
        coachId: paymentRow.coachId,
        amount: paymentRow.amount.toString(),
        receiptKey: paymentRow.receiptKey,
        status: paymentRow.status,
        note: paymentRow.note,
        createdAt: paymentRow.createdAt,
        updatedAt: paymentRow.updatedAt,
      },
      registrations,
    };
  });
}

export async function updateRegistration(
  id: string,
  data: { status?: RegistrationStatus; note?: string | null },
): Promise<RegistrationWithScope> {
  const row = await getPrisma().registration.update({
    where: { id },
    data,
    select: { ...registrationSelection, coach: { select: { province: true } }, payment: { select: { status: true } } },
  });

  return { ...toRegistrationRecord(row), coachProvince: row.coach.province, paymentStatus: row.payment?.status ?? null };
}
