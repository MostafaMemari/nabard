import type { AgeCategory, Belt, Gender, WeightClass } from "@/features/base-data";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { CompetitionLevel, CompetitionRulesSnapshot, CompetitionStatus, Discipline } from "../types";
import { buildRulesSnapshot, parseRulesSnapshot } from "./snapshot";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  gender: Gender | null;
  province: Province | null;
  isActive: boolean;
  countyId: string | null;
};

export type BeltRow = Belt;

export type AgeCategoryRow = Omit<AgeCategory, "startDate" | "endDate"> & { startDate: Date; endDate: Date };

export type WeightClassRow = WeightClass;
export type EligibilityStudentRow = {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate: Date;
  beltId: string;
  profileStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export type CompetitionRow = {
  id: string;
  title: string;
  description: string | null;
  province: Province;
  level: CompetitionLevel;
  countyIds: string[];
  countyNames: string[];
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  minBeltId: string;
  maxBeltId: string;
  feePerStudent: bigint;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: Date;
  eventDate: Date;
  status: CompetitionStatus;
  rules: CompetitionRulesSnapshot | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CompetitionFilters = {
  province?: Province;
  status?: CompetitionStatus;
  discipline?: Discipline;
  gender?: Gender;
  search?: string;
  coachCountyId?: string;
};

export type CompetitionOrder = "createdAtDesc" | "deadlineAsc";

export type NewCompetitionData = {
  title: string;
  description?: string | null;
  province: Province;
  level: CompetitionLevel;
  countyIds: string[];
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  minBeltId: string;
  maxBeltId: string;
  feePerStudent: bigint;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: Date;
  eventDate: Date;
  status: CompetitionStatus;
};

export type CompetitionUpdateData = {
  title?: string;
  description?: string | null;
  level?: CompetitionLevel;
  countyIds?: string[];
  discipline?: Discipline;
  gender?: Gender;
  ageCategoryId?: string;
  minBeltId?: string;
  maxBeltId?: string;
  feePerStudent?: bigint;
  payeeCardNumber?: string;
  payeeCardHolder?: string;
  registrationDeadline?: Date;
  eventDate?: Date;
  status?: CompetitionStatus;
  cancelReason?: string | null;
};

export type DeadlineExtensionInput = {
  competitionId: string;
  previousDeadline: Date;
  newDeadline: Date;
  reopenForRejected: boolean;
  reason: string;
  createdById: string;
};

export type DeadlineExtensionRow = {
  id: string;
  previousDeadline: Date;
  newDeadline: Date;
  reopenForRejected: boolean;
  reason: string;
  createdByName: string;
  createdAt: Date;
};

export type CompetitionsRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findCountyById(id: string): Promise<{ id: string; province: Province; name: string } | null>;
  countCompetitions(filters: CompetitionFilters): Promise<number>;
  findCompetitions(filters: CompetitionFilters, skip: number, take: number, order: CompetitionOrder): Promise<CompetitionRow[]>;
  findCompetitionById(id: string): Promise<CompetitionRow | null>;
  countRegistrations(competitionId: string): Promise<number>;
  createCompetition(data: NewCompetitionData): Promise<CompetitionRow>;
  updateCompetition(id: string, data: CompetitionUpdateData): Promise<CompetitionRow>;
  publishWithRulesSnapshot(id: string): Promise<CompetitionRow | null>;
  cancelCompetitionWithRefunds(id: string, reason: string): Promise<CompetitionRow | null>;
  extendDeadline(input: DeadlineExtensionInput): Promise<CompetitionRow>;
  findDeadlineExtensions(competitionId: string): Promise<DeadlineExtensionRow[]>;
  findAllBelts(): Promise<BeltRow[]>;
  findAllAgeCategories(): Promise<AgeCategoryRow[]>;
  findWeightClasses(ageCategoryId: string, gender: Gender): Promise<WeightClassRow[]>;
  findCoachStudents(coachId: string): Promise<EligibilityStudentRow[]>;
};

const competitionSelection = {
  id: true,
  title: true,
  description: true,
  province: true,
  level: true,
  counties: { select: { countyId: true, county: { select: { name: true } } } },
  discipline: true,
  gender: true,
  ageCategoryId: true,
  minBeltId: true,
  maxBeltId: true,
  feePerStudent: true,
  payeeCardNumber: true,
  payeeCardHolder: true,
  registrationDeadline: true,
  eventDate: true,
  status: true,
  rulesSnapshot: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CompetitionRowInput = Omit<CompetitionRow, "countyIds" | "countyNames" | "rules"> & {
  counties: Array<{ countyId: string; county: { name: string } }>;
  rulesSnapshot: unknown;
};

function toCompetitionRow(row: CompetitionRowInput): CompetitionRow {
  const counties = [...row.counties].sort((left, right) => left.county.name.localeCompare(right.county.name, "fa"));
  const { counties: _counties, rulesSnapshot, ...rest } = row;

  return {
    ...rest,
    rules: parseRulesSnapshot(rulesSnapshot),
    countyIds: counties.map((item) => item.countyId),
    countyNames: counties.map((item) => item.county.name),
  };
}

const beltSelection = {
  id: true,
  code: true,
  label: true,
  level: true,
  order: true,
  rankType: true,
  color: true,
  colorHex: true,
  isActive: true,
} as const;

function competitionWhere(filters: CompetitionFilters) {
  return {
    ...(filters.province === undefined ? {} : { province: filters.province }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.discipline === undefined ? {} : { discipline: filters.discipline }),
    ...(filters.gender === undefined ? {} : { gender: filters.gender }),
    ...(filters.search === undefined ? {} : { title: { contains: filters.search, mode: "insensitive" as const } }),
    ...(filters.coachCountyId === undefined
      ? {}
      : {
          OR: [{ level: "PROVINCIAL" as const }, { level: "COUNTY" as const, counties: { some: { countyId: filters.coachCountyId } } }],
        }),
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, gender: true, province: true, isActive: true, countyId: true },
  });
}

export async function findCountyById(id: string): Promise<{ id: string; province: Province; name: string } | null> {
  return getPrisma().county.findUnique({ where: { id }, select: { id: true, province: true, name: true } });
}

export async function countCompetitions(filters: CompetitionFilters): Promise<number> {
  return getPrisma().competition.count({ where: competitionWhere(filters) });
}

export async function findCompetitions(
  filters: CompetitionFilters,
  skip: number,
  take: number,
  order: CompetitionOrder,
): Promise<CompetitionRow[]> {
  const rows = await getPrisma().competition.findMany({
    where: competitionWhere(filters),
    select: competitionSelection,
    orderBy: order === "deadlineAsc" ? [{ registrationDeadline: "asc" }, { createdAt: "asc" }] : { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map(toCompetitionRow);
}

export async function findCompetitionById(id: string): Promise<CompetitionRow | null> {
  const row = await getPrisma().competition.findUnique({ where: { id }, select: competitionSelection });

  return row === null ? null : toCompetitionRow(row);
}

export async function countRegistrations(competitionId: string): Promise<number> {
  return getPrisma().registration.count({ where: { competitionId } });
}

export async function createCompetition(data: NewCompetitionData): Promise<CompetitionRow> {
  const row = await getPrisma().competition.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      province: data.province,
      level: data.level,
      counties: { create: data.countyIds.map((countyId) => ({ countyId })) },
      discipline: data.discipline,
      gender: data.gender,
      ageCategoryId: data.ageCategoryId,
      minBeltId: data.minBeltId,
      maxBeltId: data.maxBeltId,
      feePerStudent: data.feePerStudent,
      payeeCardNumber: data.payeeCardNumber,
      payeeCardHolder: data.payeeCardHolder,
      registrationDeadline: data.registrationDeadline,
      eventDate: data.eventDate,
      status: data.status,
    },
    select: competitionSelection,
  });

  return toCompetitionRow(row);
}

export async function updateCompetition(id: string, data: CompetitionUpdateData): Promise<CompetitionRow> {
  const { countyIds, ...rest } = data;
  const row = await getPrisma().competition.update({
    where: { id },
    data: {
      ...rest,
      ...(countyIds === undefined
        ? {}
        : { counties: { deleteMany: {}, create: [...new Set(countyIds)].map((countyId) => ({ countyId })) } }),
    },
    select: competitionSelection,
  });

  return toCompetitionRow(row);
}

export const UNREVIEWED_PAYMENT_REFUND_NOTE = "پرداخت بررسی نشده بود؛ قبل از بازپرداخت دریافت وجه را تأیید کنید";

export async function cancelCompetitionWithRefunds(id: string, reason: string): Promise<CompetitionRow | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.competition.updateMany({
      where: { id, status: "PUBLISHED" },
      data: { status: "CANCELED", cancelReason: reason },
    });
    if (applied.count === 0) return null;

    const rows = await tx.registration.findMany({
      where: { competitionId: id, payment: { status: { in: ["CONFIRMED", "PENDING"] } }, refund: { is: null } },
      select: {
        id: true,
        coachId: true,
        payment: { select: { status: true } },
        competition: { select: { feePerStudent: true } },
      },
    });

    for (const row of rows) {
      await tx.refund.create({
        data: {
          registrationId: row.id,
          coachId: row.coachId,
          amount: row.competition.feePerStudent,
          reason: "COMPETITION_CANCELED",
          status: "PENDING",
          ...(row.payment?.status === "PENDING" ? { note: UNREVIEWED_PAYMENT_REFUND_NOTE } : {}),
        },
      });
    }

    return tx.competition
      .findUnique({ where: { id }, select: competitionSelection })
      .then((row) => (row === null ? null : toCompetitionRow(row)));
  });
}

export async function extendDeadline(input: DeadlineExtensionInput): Promise<CompetitionRow> {
  return getPrisma().$transaction(async (tx) => {
    await tx.deadlineExtension.create({
      data: {
        competitionId: input.competitionId,
        previousDeadline: input.previousDeadline,
        newDeadline: input.newDeadline,
        reopenForRejected: input.reopenForRejected,
        reason: input.reason,
        createdById: input.createdById,
      },
    });

    return tx.competition
      .update({
        where: { id: input.competitionId },
        data: { registrationDeadline: input.newDeadline },
        select: competitionSelection,
      })
      .then(toCompetitionRow);
  });
}

export async function findDeadlineExtensions(competitionId: string): Promise<DeadlineExtensionRow[]> {
  const rows = await getPrisma().deadlineExtension.findMany({
    where: { competitionId },
    select: {
      id: true,
      previousDeadline: true,
      newDeadline: true,
      reopenForRejected: true,
      reason: true,
      createdAt: true,
      createdBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    previousDeadline: row.previousDeadline,
    newDeadline: row.newDeadline,
    reopenForRejected: row.reopenForRejected,
    reason: row.reason,
    createdByName: row.createdBy.fullName,
    createdAt: row.createdAt,
  }));
}

export async function findAllBelts(): Promise<BeltRow[]> {
  return getPrisma().belt.findMany({ select: beltSelection, orderBy: { level: "asc" } });
}

// Publishes inside one transaction and freezes the rules: age category, min and
// max belt and the weight classes of the age category and gender. The snapshot
// is read from the live rows in the same transaction, so later base data edits
// never change a published competition.
export async function publishWithRulesSnapshot(id: string): Promise<CompetitionRow | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.competition.updateMany({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED" } });
    if (applied.count === 0) return null;

    const row = await tx.competition.findUnique({
      where: { id },
      select: {
        ageCategoryId: true,
        gender: true,
        minBeltId: true,
        maxBeltId: true,
      },
    });
    if (!row) return null;

    const [ageCategory, minBelt, maxBelt, weightClasses] = await Promise.all([
      tx.ageCategory.findUnique({ where: { id: row.ageCategoryId } }),
      tx.belt.findUnique({ where: { id: row.minBeltId } }),
      tx.belt.findUnique({ where: { id: row.maxBeltId } }),
      tx.weightClass.findMany({ where: { ageCategoryId: row.ageCategoryId, gender: row.gender }, orderBy: { order: "asc" } }),
    ]);

    if (!ageCategory || !minBelt || !maxBelt) return null;

    const snapshot = buildRulesSnapshot({ ageCategory, minBelt, maxBelt, weightClasses });

    return tx.competition.update({ where: { id }, data: { rulesSnapshot: snapshot }, select: competitionSelection }).then(toCompetitionRow);
  });
}

export async function findAllAgeCategories(): Promise<AgeCategoryRow[]> {
  return getPrisma().ageCategory.findMany({
    select: { id: true, code: true, label: true, startDate: true, endDate: true, birthYearStart: true, birthYearEnd: true, isActive: true },
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }],
  });
}

export async function findWeightClasses(ageCategoryId: string, gender: Gender): Promise<WeightClassRow[]> {
  const rows = await getPrisma().weightClass.findMany({
    where: { ageCategoryId, gender },
    select: {
      id: true,
      ageCategoryId: true,
      gender: true,
      label: true,
      minWeightKg: true,
      maxWeightKg: true,
      order: true,
      excludeMin: true,
      excludeMax: true,
      isActive: true,
    },
    orderBy: { order: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    ageCategoryId: row.ageCategoryId,
    gender: row.gender,
    label: row.label,
    minWeightKg: Number(row.minWeightKg),
    maxWeightKg: row.maxWeightKg === null ? null : Number(row.maxWeightKg),
    order: row.order,
    isActive: row.isActive,
    excludeMin: row.excludeMin,
    excludeMax: row.excludeMax,
  }));
}

export async function findCoachStudents(coachId: string): Promise<EligibilityStudentRow[]> {
  return getPrisma().student.findMany({
    where: { coachId },
    select: { id: true, fullName: true, gender: true, birthDate: true, beltId: true, profileStatus: true },
    orderBy: { createdAt: "asc" },
  });
}
