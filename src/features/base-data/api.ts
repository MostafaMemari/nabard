import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { ageCategories, belts, weightClasses } from "./mock/base-data";
import type { AgeCategory, Belt, Gender, WeightClass } from "./types";

export async function listBelts(query: ListQuery = {}): Promise<ListResult<Belt>> {
  await mockDelay();
  return paginate(belts, query);
}

export async function listAgeCategories(query: ListQuery = {}): Promise<ListResult<AgeCategory>> {
  await mockDelay();
  return paginate(ageCategories, query);
}

export async function listWeightClasses(params: { ageCategoryId?: string; gender?: Gender } = {}): Promise<ListResult<WeightClass>> {
  await mockDelay();
  const filtered = weightClasses.filter(
    (item) =>
      (params.ageCategoryId === undefined || item.ageCategoryId === params.ageCategoryId) &&
      (params.gender === undefined || item.gender === params.gender),
  );

  return paginate(filtered);
}
