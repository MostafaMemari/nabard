import type { Belt, Gender, WeightClass } from "@/features/base-data";
import type { CompetitionLevel, CompetitionRulesSnapshot, CompetitionStatus, Discipline } from "@/features/competitions";
import { parseRulesSnapshot } from "@/features/competitions/server/snapshot";
import type { PaymentStatus } from "@/features/payments";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { RegistrationStatus } from "../types";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
  countyId: string | null;
  gender: Gender | null;
};

export type RegistrationStudentInfo = {
  id: string;
  fullName: string;
  beltId: string;
};

export type RegistrationRecord = {
  id: string;
  competitionId: string;
  competitionTitle: string;
  studentId: string;
  coachId: string;
  paymentId: string | null;
  weightClassId: string | null;
  weightClassLabel: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  student: RegistrationStudentInfo;
};

export type RegistrationWithScope = RegistrationRecord & {
  coachProvince: Province | null;
  paymentStatus: PaymentStatus | null;
};

export type RegistrationFilters = {
  coachId?: string;
  province?: Province;
  competitionId?: string;
  paymentId?: string;
  studentId?: string;
  status?: RegistrationStatus;
};

export type CompetitionRegistrationRow = {
  id: string;
  title: string;
  province: Province;
  level: CompetitionLevel;
  countyIds: string[];
  status: CompetitionStatus;
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  minBeltId: string;
  maxBeltId: string;
  rules: CompetitionRulesSnapshot | null;
  feePerStudent: bigint;
  registrationDeadline: Date;
  eventDate: Date;
  createdAt: Date;
};

export type AgeCategoryRow = {
  id: string;
  code: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
};

export type RegistrationStudentRow = {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate: Date;
  beltId: string;
  profileStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export type RegistrationBundleInput = {
  competitionId: string;
  coachId: string;
  amount: bigint;
  receiptKey: string;
  students: Array<{
    studentId: string;
    weightClassId: string | null;
    weightClassLabel: string | null;
    weightClassMin: number | null;
    weightClassMax: number | null;
  }>;
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
  createRefund: boolean;
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
  student: { id: string; fullName: string; nationalCode: string; birthDate: Date; beltLabel: string };
  coachName: string;
  weightClass: { order: number } | null;
  weightClassLabel: string | null;
};

export type RegistrationRejectionRow = {
  studentId: string;
  rejectedAt: Date;
};

export type DeadlineExtensionStatusRow = {
  reopenForRejected: boolean;
  createdAt: Date;
};

export type EventDayRegistrationRow = {
  id: string;
  student: { id: string; fullName: string; nationalCode: string };
  coachName: string;
  beltLabel: string;
  weightClassId: string | null;
  weightClassLabel: string | null;
  weightClassOrder: number | null;
  status: RegistrationStatus;
  checkInAt: Date | null;
  checkInByName: string | null;
  weighInKg: number | null;
  weighInAt: Date | null;
  weighInByName: string | null;
  weighInVerdict: "MATCH" | "MOVED" | "OUT_OF_WEIGHT" | null;
};

export type EventDayRegistrationDetailRow = {
  id: string;
  status: RegistrationStatus;
  weightClassId: string | null;
  weightClassLabel: string | null;
  coachProvince: Province | null;
  competition: { id: string; status: CompetitionStatus; discipline: Discipline; rules: CompetitionRulesSnapshot | null };
};

export type WeighInUpdateInput = {
  weightKg: number;
  weighInById: string;
  weighInAt: Date;
  verdict: "MATCH" | "MOVED" | "OUT_OF_WEIGHT";
  movedTo: { id: string; label: string; min: number; max: number | null } | null;
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
  findEventDayRows(competitionId: string): Promise<EventDayRegistrationRow[]>;
  findEventDayRegistrationById(id: string): Promise<EventDayRegistrationDetailRow | null>;
  updateRegistrationWeighIn(id: string, input: WeighInUpdateInput): Promise<boolean>;
  updateRegistrationCheckIn(id: string, checkedIn: boolean, userId: string): Promise<boolean>;
};

const registrationSelection = {
  id: true,
  competitionId: true,
  studentId: true,
  coachId: true,
  paymentId: true,
  weightClassId: true,
  weightClassLabel: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  competition: { select: { title: true } },
  student: { select: { id: true, fullName: true, beltId: true } },
} as const;

type RegistrationRowInput = {
  id: string;
  competitionId: string;
  studentId: string;
  coachId: string;
  paymentId: string | null;
  weightClassId: string | null;
  weightClassLabel: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  competition: { title: string };
  student: { id: string; fullName: string; beltId: string };
};

function toRegistrationRecord(row: RegistrationRowInput): RegistrationRecord {
  return {
    id: row.id,
    competitionId: row.competitionId,
    competitionTitle: row.competition.title,
    studentId: row.studentId,
    coachId: row.coachId,
    paymentId: row.paymentId,
    weightClassId: row.weightClassId,
    weightClassLabel: row.weightClassLabel,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    student: {
      id: row.student.id,
      fullName: row.student.fullName,
      beltId: row.student.beltId,
    },
  };
}

function registrationWhere(filters: RegistrationFilters) {
  return {
    ...(filters.coachId === undefined ? {} : { coachId: filters.coachId }),
    ...(filters.province === undefined ? {} : { coach: { province: filters.province } }),
    ...(filters.competitionId === undefined ? {} : { competitionId: filters.competitionId }),
    ...(filters.paymentId === undefined ? {} : { paymentId: filters.paymentId }),
    ...(filters.studentId === undefined ? {} : { studentId: filters.studentId }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true, countyId: true, gender: true },
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
      weightClassLabel: true,
      student: {
        select: { id: true, fullName: true, nationalCode: true, birthDate: true, belt: { select: { label: true } } },
      },
      coach: { select: { fullName: true } },
      weightClass: { select: { order: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    student: {
      id: row.student.id,
      fullName: row.student.fullName,
      nationalCode: row.student.nationalCode,
      birthDate: row.student.birthDate,
      beltLabel: row.student.belt.label,
    },
    coachName: row.coach.fullName,
    weightClass: row.weightClass === null ? null : { order: row.weightClass.order },
    weightClassLabel: row.weightClassLabel,
  }));
}

export async function findCompetitionById(id: string): Promise<CompetitionRegistrationRow | null> {
  const row = await getPrisma().competition.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      province: true,
      level: true,
      counties: { select: { countyId: true } },
      status: true,
      discipline: true,
      gender: true,
      ageCategoryId: true,
      minBeltId: true,
      maxBeltId: true,
      rulesSnapshot: true,
      feePerStudent: true,
      registrationDeadline: true,
      eventDate: true,
      createdAt: true,
    },
  });
  if (row === null) return null;

  const { rulesSnapshot, ...rest } = row;

  return { ...rest, rules: parseRulesSnapshot(rulesSnapshot), countyIds: row.counties.map((item) => item.countyId) };
}

export async function findAgeCategoryById(id: string): Promise<AgeCategoryRow | null> {
  return getPrisma().ageCategory.findUnique({
    where: { id },
    select: { id: true, code: true, label: true, startDate: true, endDate: true, isActive: true },
  });
}

export async function findCoachStudentsByIds(coachId: string, studentIds: string[]): Promise<RegistrationStudentRow[]> {
  return getPrisma().student.findMany({
    where: { coachId, id: { in: studentIds } },
    select: { id: true, fullName: true, gender: true, birthDate: true, beltId: true, profileStatus: true },
  });
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
    isActive: row.isActive,
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
          weightClassLabel: student.weightClassLabel,
          weightClassMin: student.weightClassMin,
          weightClassMax: student.weightClassMax,
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
      weightClassLabel: true,
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
    weightClassLabel: row.weightClassLabel ?? row.weightClass?.label ?? null,
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
      select: {
        ...registrationSelection,
        coach: { select: { province: true } },
        payment: { select: { status: true } },
        competition: { select: { title: true, feePerStudent: true } },
      },
    });
    if (row === null) return null;

    if (applied.count > 0 && input.createRefund) {
      await tx.refund.create({
        data: {
          registrationId: id,
          coachId: row.coachId,
          amount: row.competition.feePerStudent,
          reason: "REGISTRATION_REJECTED",
          status: "PENDING",
        },
      });
    }

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

export async function findEventDayRows(competitionId: string): Promise<EventDayRegistrationRow[]> {
  const rows = await getPrisma().registration.findMany({
    where: { competitionId, status: "APPROVED" },
    select: {
      id: true,
      status: true,
      weightClassId: true,
      weightClassLabel: true,
      weightClass: { select: { order: true } },
      weighInKg: true,
      weighInAt: true,
      weighInVerdict: true,
      checkInAt: true,
      student: { select: { id: true, fullName: true, nationalCode: true, belt: { select: { label: true } } } },
      coach: { select: { fullName: true } },
      checkInBy: { select: { fullName: true } },
      weighInBy: { select: { fullName: true } },
    },
    orderBy: [{ weightClass: { order: "asc" } }, { createdAt: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    student: row.student,
    coachName: row.coach.fullName,
    beltLabel: row.student.belt.label,
    weightClassId: row.weightClassId,
    weightClassLabel: row.weightClassLabel,
    weightClassOrder: row.weightClass?.order ?? null,
    status: row.status,
    checkInAt: row.checkInAt,
    checkInByName: row.checkInBy?.fullName ?? null,
    weighInKg: row.weighInKg === null ? null : Number(row.weighInKg),
    weighInAt: row.weighInAt,
    weighInByName: row.weighInBy?.fullName ?? null,
    weighInVerdict: row.weighInVerdict,
  }));
}

export async function findEventDayRegistrationById(id: string): Promise<EventDayRegistrationDetailRow | null> {
  const row = await getPrisma().registration.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      weightClassId: true,
      weightClassLabel: true,
      coach: { select: { province: true } },
      competition: { select: { id: true, status: true, discipline: true, rulesSnapshot: true } },
    },
  });
  if (row === null) return null;

  return {
    id: row.id,
    status: row.status,
    weightClassId: row.weightClassId,
    weightClassLabel: row.weightClassLabel,
    coachProvince: row.coach.province,
    competition: {
      id: row.competition.id,
      status: row.competition.status,
      discipline: row.competition.discipline,
      rules: parseRulesSnapshot(row.competition.rulesSnapshot),
    },
  };
}

export async function updateRegistrationWeighIn(id: string, input: WeighInUpdateInput): Promise<boolean> {
  const applied = await getPrisma().registration.updateMany({
    where: { id, status: "APPROVED" },
    data: {
      weighInKg: input.weightKg,
      weighInAt: input.weighInAt,
      weighInById: input.weighInById,
      weighInVerdict: input.verdict,
      ...(input.movedTo === null
        ? {}
        : {
            weightClassId: input.movedTo.id,
            weightClassLabel: input.movedTo.label,
            weightClassMin: input.movedTo.min,
            weightClassMax: input.movedTo.max,
          }),
    },
  });

  return applied.count > 0;
}

export async function updateRegistrationCheckIn(id: string, checkedIn: boolean, userId: string): Promise<boolean> {
  const applied = await getPrisma().registration.updateMany({
    where: { id, status: "APPROVED" },
    data: checkedIn ? { checkInAt: new Date(), checkInById: userId } : { checkInAt: null, checkInById: null },
  });

  return applied.count > 0;
}
