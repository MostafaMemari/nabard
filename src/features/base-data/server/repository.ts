import { getPrisma } from "@/lib/prisma";
import type { AgeCategory, Belt, WeightClass } from "../types";

export type AgeCategoryRecord = Omit<AgeCategory, "startDate" | "endDate"> & { startDate: Date; endDate: Date };

export async function findAllBelts(): Promise<Belt[]> {
  const belts = await getPrisma().belt.findMany({ orderBy: { level: "asc" } });
  return belts.map((belt) => ({
    id: belt.id,
    name: belt.name,
    level: belt.level,
    order: belt.order,
    rankType: belt.rankType,
    color: belt.color,
    colorHex: belt.colorHex,
  }));
}

export async function findAllAgeCategories(): Promise<AgeCategoryRecord[]> {
  const categories = await getPrisma().ageCategory.findMany({ orderBy: { name: "asc" } });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    startDate: category.startDate,
    endDate: category.endDate,
    birthYearStart: category.birthYearStart,
    birthYearEnd: category.birthYearEnd,
  }));
}

export async function findAllWeightClasses(): Promise<WeightClass[]> {
  const weightClasses = await getPrisma().weightClass.findMany({
    orderBy: [{ ageCategoryId: "asc" }, { gender: "asc" }, { order: "asc" }],
  });
  return weightClasses.map((weightClass) => ({
    id: weightClass.id,
    ageCategoryId: weightClass.ageCategoryId,
    gender: weightClass.gender,
    label: weightClass.label,
    minWeightKg: Number(weightClass.minWeightKg),
    maxWeightKg: weightClass.maxWeightKg === null ? null : Number(weightClass.maxWeightKg),
    order: weightClass.order,
    excludeMin: weightClass.excludeMin,
    excludeMax: weightClass.excludeMax,
  }));
}
