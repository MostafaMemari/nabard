import type { AgeCategory, Belt, Gender, WeightClass } from "@/features/base-data";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { CompetitionStatus, Discipline } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
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
  weightKg: number | null;
};

export type CompetitionRow = {
  id: string;
  title: string;
  province: Province;
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
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CompetitionFilters = {
  province: Province;
  status?: CompetitionStatus;
  discipline?: Discipline;
  search?: string;
};

export type CompetitionOrder = "createdAtDesc" | "deadlineAsc";

export type NewCompetitionData = {
  title: string;
  province: Province;
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

export type CompetitionsRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countCompetitions(filters: CompetitionFilters): Promise<number>;
  findCompetitions(filters: CompetitionFilters, skip: number, take: number, order: CompetitionOrder): Promise<CompetitionRow[]>;
  findCompetitionById(id: string): Promise<CompetitionRow | null>;
  countRegistrations(competitionId: string): Promise<number>;
  createCompetition(data: NewCompetitionData): Promise<CompetitionRow>;
  updateCompetition(id: string, data: CompetitionUpdateData): Promise<CompetitionRow>;
  findAllBelts(): Promise<BeltRow[]>;
  findAllAgeCategories(): Promise<AgeCategoryRow[]>;
  findWeightClasses(ageCategoryId: string, gender: Gender): Promise<WeightClassRow[]>;
  findCoachStudents(coachId: string): Promise<EligibilityStudentRow[]>;
};

const competitionSelection = {
  id: true,
  title: true,
  province: true,
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
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
} as const;

const beltSelection = {
  id: true,
  name: true,
  level: true,
  order: true,
  rankType: true,
  color: true,
  colorHex: true,
} as const;

function competitionWhere(filters: CompetitionFilters) {
  return {
    province: filters.province,
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.discipline === undefined ? {} : { discipline: filters.discipline }),
    ...(filters.search === undefined ? {} : { title: { contains: filters.search, mode: "insensitive" as const } }),
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
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
  return getPrisma().competition.findMany({
    where: competitionWhere(filters),
    select: competitionSelection,
    orderBy: order === "deadlineAsc" ? [{ registrationDeadline: "asc" }, { createdAt: "asc" }] : { createdAt: "desc" },
    skip,
    take,
  });
}

export async function findCompetitionById(id: string): Promise<CompetitionRow | null> {
  return getPrisma().competition.findUnique({ where: { id }, select: competitionSelection });
}

export async function countRegistrations(competitionId: string): Promise<number> {
  return getPrisma().registration.count({ where: { competitionId } });
}

export async function createCompetition(data: NewCompetitionData): Promise<CompetitionRow> {
  return getPrisma().competition.create({
    data: {
      title: data.title,
      province: data.province,
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
}

export async function updateCompetition(id: string, data: CompetitionUpdateData): Promise<CompetitionRow> {
  return getPrisma().competition.update({ where: { id }, data, select: competitionSelection });
}

export async function findAllBelts(): Promise<BeltRow[]> {
  return getPrisma().belt.findMany({ select: beltSelection, orderBy: { level: "asc" } });
}

export async function findAllAgeCategories(): Promise<AgeCategoryRow[]> {
  return getPrisma().ageCategory.findMany({
    select: { id: true, name: true, startDate: true, endDate: true, birthYearStart: true, birthYearEnd: true },
    orderBy: { name: "asc" },
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
    excludeMin: row.excludeMin,
    excludeMax: row.excludeMax,
  }));
}

export async function findCoachStudents(coachId: string): Promise<EligibilityStudentRow[]> {
  const rows = await getPrisma().student.findMany({
    where: { coachId },
    select: { id: true, fullName: true, gender: true, birthDate: true, beltId: true, weightKg: true },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    gender: row.gender,
    birthDate: row.birthDate,
    beltId: row.beltId,
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
  }));
}
