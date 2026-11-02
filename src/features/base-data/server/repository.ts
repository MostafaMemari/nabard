import { getPrisma } from "@/lib/prisma";
import type { AgeCategory, Belt, WeightClass } from "../types";

export type AgeCategoryRecord = Omit<AgeCategory, "startDate" | "endDate"> & { startDate: Date; endDate: Date };

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

const weightClassSelection = {
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
} as const;

export async function findAllBelts(): Promise<Belt[]> {
  const belts = await getPrisma().belt.findMany({ where: { isActive: true }, select: beltSelection, orderBy: { level: "asc" } });
  return belts;
}

export async function findAllAgeCategories(): Promise<AgeCategoryRecord[]> {
  const categories = await getPrisma().ageCategory.findMany({
    where: { isActive: true },
    select: ageCategorySelection,
    orderBy: [{ startDate: "asc" }, { endDate: "asc" }],
  });
  return categories;
}

export async function findAllWeightClasses(): Promise<WeightClass[]> {
  const weightClasses = await getPrisma().weightClass.findMany({
    where: { isActive: true },
    select: weightClassSelection,
    orderBy: [{ ageCategoryId: "asc" }, { gender: "asc" }, { order: "asc" }],
  });

  return weightClasses.map((weightClass) => ({
    ...weightClass,
    minWeightKg: Number(weightClass.minWeightKg),
    maxWeightKg: weightClass.maxWeightKg === null ? null : Number(weightClass.maxWeightKg),
  }));
}

export async function findWeightClasses(ageCategoryId: string, gender: "MALE" | "FEMALE"): Promise<WeightClass[]> {
  const rows = await getPrisma().weightClass.findMany({
    where: { ageCategoryId, gender, isActive: true },
    select: weightClassSelection,
    orderBy: { order: "asc" },
  });

  return rows.map((row) => ({
    ...row,
    minWeightKg: Number(row.minWeightKg),
    maxWeightKg: row.maxWeightKg === null ? null : Number(row.maxWeightKg),
  }));
}

export type BaseDataResult = {
  belts: Belt[];
  ageCategories: AgeCategoryRecord[];
  weightClasses: WeightClass[];
};

export async function getBaseData(): Promise<BaseDataResult> {
  const [belts, ageCategories, weightClasses] = await Promise.all([findAllBelts(), findAllAgeCategories(), findAllWeightClasses()]);
  return { belts, ageCategories, weightClasses };
}
