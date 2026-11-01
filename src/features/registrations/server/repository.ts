import type { AgeCategoryName, Belt, BeltName, Gender, WeightClass } from "@/features/base-data";
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

export type RegistrationStudentInfo = {
  id: string;
  fullName: string;
  beltId: string;
  weightKg: number | null;
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
  student: RegistrationStudentInfo;
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

export type RegistrationTransitionInput = {
  status: "APPROVED" | "REJECTED";
  note: string | null;
};

export type RegistrationTransitionResult =
  | { kind: "updated"; row: RegistrationWithScope }
  | { kind: "conflict"; reason: "REVIEWED" | "PAYMENT_NOT_CONFIRMED"; row: RegistrationWithScope };

export type RegistrationPaymentRow = {
  id: string;
  status: PaymentStatus;
  amount: bigint;
  createdAt: Date;
};

export type RegistrationBundleRow = {
  id: string;
  studentName: string;
  status: RegistrationStatus;
  note: string | null;
};

export type RegistrationDetailRow = {
  registration: RegistrationWithScope;
  competition: { id: string; title: string; registrationDeadline: Date } | null;
  weightClassLabel: string | null;
  payment: RegistrationPaymentRow | null;
  bundle: RegistrationBundleRow[];
};

export type ParticipantRow = {
  id: string;
  student: { id: string; fullName: string; nationalCode: string; birthDate: Date; beltName: BeltName };
  coachName: string;
  weightClass: { label: string; order: number } | null;
};

export type RegistrationRejectionRow = {
  studentId: string;
  rejectedAt: Date;
};

export type DeadlineExtensionStatusRow = {
  reopenForRejected: boolean;
  createdAt: Date;
};

export type RegistrationRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findCompetitionTitleById(id: string): Promise<string | null>;
  findApprovedParticipants(competitionId: string): Promise<ParticipantRow[]>;
  findCompetitionById(id: string): Promise<CompetitionRegistrationRow | null>;
  findAgeCategoryById(id: string): Promise<AgeCategoryRow | null>;
  findCoachStudentsByIds(coachId: string, studentIds: string[]): Promise<RegistrationStudentRow[]>;
  findAllBelts(): Promise<Belt[]>;
  findWeightClasses(ageCategoryId: string, gender: Gender): Promise<WeightClass[]>;
  findActiveRegisteredStudentIds(competitionId: string, studentIds: string[]): Promise<string[]>;
  findLatestRejectionsByStudentIds(competitionId: string, studentIds: string[]): Promise<RegistrationRejectionRow[]>;
  findLatestDeadlineExtension(competitionId: string): Promise<DeadlineExtensionStatusRow | null>;
  countRegistrations(filters: RegistrationFilters): Promise<number>;
  findRegistrations(filters: RegistrationFilters, skip: number, take: number): Promise<RegistrationWithScope[]>;
  findRegistrationById(id: string): Promise<RegistrationWithScope | null>;
  findRegistrationDetailById(id: string): Promise<RegistrationDetailRow | null>;
  createRegistrationBundle(input: RegistrationBundleInput): Promise<RegistrationBundle>;
  transitionRegistrationFromPending(id: string, input: RegistrationTransitionInput): Promise<RegistrationTransitionResult | null>;
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
  student: { select: { id: true, fullName: true, beltId: true, weightKg: true } },
} as const;

type RegistrationRowInput = {
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
  student: { id: string; fullName: string; beltId: string; weightKg: unknown };
};

function toRegistrationRecord(row: RegistrationRowInput): RegistrationRecord {
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
    student: {
      id: row.student.id,
      fullName: row.student.fullName,
      beltId: row.student.beltId,
      weightKg: row.student.weightKg === null ? null : Number(row.student.weightKg),
    },
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

export async function findCompetitionTitleById(id: string): Promise<string | null> {
  const row = await getPrisma().competition.findUnique({ where: { id }, select: { title: true } });
  return row?.title ?? null;
}

export async function findApprovedParticipants(competitionId: string): Promise<ParticipantRow[]> {
  const rows = await getPrisma().registration.findMany({
    where: { competitionId, status: "APPROVED" },
    select: {
      id: true,
      student: {
        select: { id: true, fullName: true, nationalCode: true, birthDate: true, belt: { select: { name: true } } },
      },
      coach: { select: { fullName: true } },
      weightClass: { select: { label: true, order: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    student: {
      id: row.student.id,
      fullName: row.student.fullName,
      nationalCode: row.student.nationalCode,
      birthDate: row.student.birthDate,
      beltName: row.student.belt.name,
    },
    coachName: row.coach.fullName,
    weightClass: row.weightClass === null ? null : { label: row.weightClass.label, order: row.weightClass.order },
  }));
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

export async function findActiveRegisteredStudentIds(competitionId: string, studentIds: string[]): Promise<string[]> {
  const rows = await getPrisma().registration.findMany({
    where: { competitionId, studentId: { in: studentIds }, status: { not: "REJECTED" } },
    select: { studentId: true },
  });

  return rows.map((row) => row.studentId);
}

export async function findLatestRejectionsByStudentIds(competitionId: string, studentIds: string[]): Promise<RegistrationRejectionRow[]> {
  const rows = await getPrisma().registration.findMany({
    where: { competitionId, studentId: { in: studentIds }, status: "REJECTED" },
    select: { studentId: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const latest = new Map<string, Date>();
  for (const row of rows) {
    if (!latest.has(row.studentId)) latest.set(row.studentId, row.updatedAt);
  }

  return [...latest].map(([studentId, rejectedAt]) => ({ studentId, rejectedAt }));
}

export async function findLatestDeadlineExtension(competitionId: string): Promise<DeadlineExtensionStatusRow | null> {
  const row = await getPrisma().deadlineExtension.findFirst({
    where: { competitionId },
    select: { reopenForRejected: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return row;
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

export async function findRegistrationDetailById(id: string): Promise<RegistrationDetailRow | null> {
  const prisma = getPrisma();
  const row = await prisma.registration.findUnique({
    where: { id },
    select: {
      ...registrationSelection,
      coach: { select: { province: true } },
      payment: { select: { status: true } },
      weightClass: { select: { label: true } },
      competition: { select: { id: true, title: true, registrationDeadline: true } },
    },
  });
  if (row === null) return null;

  const payment = row.paymentId
    ? await prisma.payment.findUnique({
        where: { id: row.paymentId },
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
          registrations: {
            select: { id: true, status: true, note: true, student: { select: { fullName: true } } },
            orderBy: { createdAt: "asc" as const },
          },
        },
      })
    : null;

  return {
    registration: {
      ...toRegistrationRecord(row),
      coachProvince: row.coach.province,
      paymentStatus: row.payment?.status ?? null,
    },
    competition: row.competition,
    weightClassLabel: row.weightClass?.label ?? null,
    payment: payment === null ? null : { id: payment.id, status: payment.status, amount: payment.amount, createdAt: payment.createdAt },
    bundle:
      payment?.registrations.map((item) => ({ id: item.id, studentName: item.student.fullName, status: item.status, note: item.note })) ??
      [],
  };
}

export async function transitionRegistrationFromPending(
  id: string,
  input: RegistrationTransitionInput,
): Promise<RegistrationTransitionResult | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.registration.updateMany({
      where: { id, status: "PENDING", payment: { status: "CONFIRMED" } },
      data: { status: input.status, note: input.note },
    });

    const row = await tx.registration.findUnique({
      where: { id },
      select: { ...registrationSelection, coach: { select: { province: true } }, payment: { select: { status: true } } },
    });
    if (row === null) return null;

    const withScope = {
      ...toRegistrationRecord(row),
      coachProvince: row.coach.province,
      paymentStatus: row.payment?.status ?? null,
    };

    if (applied.count > 0) return { kind: "updated", row: withScope };
    if (row.status !== "PENDING") return { kind: "conflict", reason: "REVIEWED", row: withScope };
    return { kind: "conflict", reason: "PAYMENT_NOT_CONFIRMED", row: withScope };
  });
}
