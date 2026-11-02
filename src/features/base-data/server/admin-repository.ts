import type { Gender } from "@/features/base-data";
import type { RankType } from "@/features/base-data/types";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { AgeCategoryRecord } from "./repository";

export type UserIdentityRecord = {
  id: string;
  role: "ADMIN" | "COACH" | "SUPER_ADMIN";
  province: Province | null;
  isActive: boolean;
};

export type BeltRecord = {
  id: string;
  code: string;
  label: string;
  level: number;
  order: number | null;
  rankType: RankType;
  color: string | null;
  colorHex: string | null;
  isActive: boolean;
};

export type WeightClassSetRecord = {
  id: string;
  ageCategoryId: string;
  gender: Gender;
  label: string;
  minWeightKg: number;
  maxWeightKg: number | null;
  order: number;
  excludeMin: boolean;
  excludeMax: boolean;
  isActive: boolean;
};

export type WeightClassSetPlan = {
  ageCategoryId: string;
  gender: Gender;
  updates: Array<{
    id: string;
    label: string;
    minWeightKg: number;
    maxWeightKg: number | null;
    excludeMin: boolean;
    excludeMax: boolean;
    order: number;
  }>;
  creates: Array<{
    label: string;
    minWeightKg: number;
    maxWeightKg: number | null;
    excludeMin: boolean;
    excludeMax: boolean;
    order: number;
  }>;
  deleteIds: string[];
  archiveIds: string[];
};

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

const ageCategorySelection = {
  id: true,
  code: true,
  label: true,
  startDate: true,
  endDate: true,
  birthYearStart: true,
  birthYearEnd: true,
  isActive: true,
} as const;

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function listBelts(includeArchived: boolean): Promise<BeltRecord[]> {
  return getPrisma().belt.findMany({
    where: includeArchived ? {} : { isActive: true },
    select: beltSelection,
    orderBy: { level: "asc" },
  });
}

export async function findBeltById(id: string): Promise<BeltRecord | null> {
  return getPrisma().belt.findUnique({ where: { id }, select: beltSelection });
}

export async function findBeltByLabel(label: string, excludeId?: string): Promise<BeltRecord | null> {
  return getPrisma().belt.findFirst({ where: { label, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: beltSelection });
}

export async function findBeltByLevel(level: number, excludeId?: string): Promise<BeltRecord | null> {
  return getPrisma().belt.findFirst({ where: { level, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: beltSelection });
}

export async function findBeltByCode(code: string): Promise<BeltRecord | null> {
  return getPrisma().belt.findUnique({ where: { code }, select: beltSelection });
}

export async function countStudentsByBelt(beltId: string): Promise<number> {
  return getPrisma().student.count({ where: { beltId } });
}

export async function countCompetitionsByBelt(beltId: string): Promise<number> {
  return getPrisma().competition.count({ where: { OR: [{ minBeltId: beltId }, { maxBeltId: beltId }] } });
}

export async function createBelt(data: {
  code: string;
  label: string;
  level: number;
  order: number;
  rankType: RankType;
  color: string | null;
  colorHex: string | null;
}): Promise<BeltRecord> {
  return getPrisma().belt.create({ data, select: beltSelection });
}

export async function updateBelt(
  id: string,
  data: {
    label?: string;
    level?: number;
    rankType?: RankType;
    color?: string | null;
    colorHex?: string | null;
    isActive?: boolean;
    order?: number;
  },
): Promise<BeltRecord> {
  return getPrisma().belt.update({ where: { id }, data, select: beltSelection });
}

export async function deleteBelt(id: string): Promise<void> {
  await getPrisma().belt.delete({ where: { id } });
}

export async function listAgeCategories(includeArchived: boolean): Promise<AgeCategoryRecord[]> {
  return getPrisma().ageCategory.findMany({
    where: includeArchived ? {} : { isActive: true },
    select: ageCategorySelection,
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }],
  });
}

export async function findAgeCategoryById(id: string): Promise<AgeCategoryRecord | null> {
  return getPrisma().ageCategory.findUnique({ where: { id }, select: ageCategorySelection });
}

export async function findAgeCategoryByLabel(label: string, excludeId?: string): Promise<AgeCategoryRecord | null> {
  return getPrisma().ageCategory.findFirst({
    where: { label, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: ageCategorySelection,
  });
}

export async function findAgeCategoryByCode(code: string): Promise<AgeCategoryRecord | null> {
  return getPrisma().ageCategory.findUnique({ where: { code }, select: ageCategorySelection });
}

export async function findOverlappingActiveCategory(
  range: { start: Date; end: Date },
  excludeId?: string,
): Promise<AgeCategoryRecord | null> {
  return getPrisma().ageCategory.findFirst({
    where: {
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startDate: { lte: range.end },
      endDate: { gte: range.start },
    },
    select: ageCategorySelection,
    orderBy: { startDate: "asc" },
  });
}

export async function countCompetitionsByAgeCategory(ageCategoryId: string): Promise<number> {
  return getPrisma().competition.count({ where: { ageCategoryId } });
}

export async function countRegistrationsByAgeCategory(ageCategoryId: string): Promise<number> {
  return getPrisma().registration.count({ where: { weightClass: { ageCategoryId } } });
}

export async function createAgeCategory(data: {
  code: string;
  label: string;
  startDate: Date;
  endDate: Date;
  birthYearStart: number | null;
  birthYearEnd: number | null;
}): Promise<AgeCategoryRecord> {
  return getPrisma().ageCategory.create({ data, select: ageCategorySelection });
}

export async function updateAgeCategory(
  id: string,
  data: {
    label?: string;
    startDate?: Date;
    endDate?: Date;
    birthYearStart?: number | null;
    birthYearEnd?: number | null;
    isActive?: boolean;
  },
): Promise<AgeCategoryRecord> {
  return getPrisma().ageCategory.update({ where: { id }, data, select: ageCategorySelection });
}

export async function deleteAgeCategory(id: string): Promise<void> {
  await getPrisma().ageCategory.delete({ where: { id } });
}

export async function findWeightClassSet(ageCategoryId: string, gender: Gender): Promise<WeightClassSetRecord[]> {
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
    ...row,
    minWeightKg: Number(row.minWeightKg),
    maxWeightKg: row.maxWeightKg === null ? null : Number(row.maxWeightKg),
  }));
}

export async function findRegisteredWeightClassIds(weightClassIds: string[]): Promise<string[]> {
  if (weightClassIds.length === 0) return [];
  const rows = await getPrisma().registration.findMany({
    where: { weightClassId: { in: weightClassIds } },
    select: { weightClassId: true },
    distinct: ["weightClassId"],
  });

  return rows.flatMap((row) => (row.weightClassId === null ? [] : [row.weightClassId]));
}

export async function findSnapshotWeightClassIds(ageCategoryId: string, gender: Gender): Promise<string[]> {
  const competitions = await getPrisma().competition.findMany({
    where: { ageCategoryId, gender, status: { not: "DRAFT" } },
    select: { rulesSnapshot: true },
  });

  const ids: string[] = [];
  for (const competition of competitions) {
    const snapshot = competition.rulesSnapshot as { weightClasses?: Array<{ id?: unknown }> } | null;
    for (const weightClass of snapshot?.weightClasses ?? []) {
      if (typeof weightClass?.id === "string") ids.push(weightClass.id);
    }
  }

  return ids;
}

export async function saveWeightClassSet(plan: WeightClassSetPlan): Promise<void> {
  await getPrisma().$transaction(async (tx) => {
    for (const row of plan.updates) {
      await tx.weightClass.update({
        where: { id: row.id },
        data: {
          label: row.label,
          minWeightKg: row.minWeightKg,
          maxWeightKg: row.maxWeightKg,
          excludeMin: row.excludeMin,
          excludeMax: row.excludeMax,
          order: row.order,
          isActive: true,
        },
      });
    }

    if (plan.creates.length > 0) {
      await tx.weightClass.createMany({
        data: plan.creates.map((row) => ({
          ageCategoryId: plan.ageCategoryId,
          gender: plan.gender,
          label: row.label,
          minWeightKg: row.minWeightKg,
          maxWeightKg: row.maxWeightKg,
          excludeMin: row.excludeMin,
          excludeMax: row.excludeMax,
          order: row.order,
        })),
      });
    }

    if (plan.deleteIds.length > 0) {
      await tx.weightClass.deleteMany({ where: { id: { in: plan.deleteIds } } });
    }

    if (plan.archiveIds.length > 0) {
      await tx.weightClass.updateMany({ where: { id: { in: plan.archiveIds } }, data: { isActive: false } });
    }
  });
}
