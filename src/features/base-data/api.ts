import { api } from "@/lib/http";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import type { AgeCategory, Belt, Gender, WeightClass } from "./types";

type BaseData = {
  belts: Belt[];
  ageCategories: AgeCategory[];
  weightClasses: WeightClass[];
};

export async function listBelts(query: ListQuery = {}): Promise<ListResult<Belt>> {
  const data = await api<BaseData>("/api/v1/base-data");
  return paginate(data.belts, query);
}

export async function listAgeCategories(query: ListQuery = {}): Promise<ListResult<AgeCategory>> {
  const data = await api<BaseData>("/api/v1/base-data");
  return paginate(data.ageCategories, query);
}

export async function listWeightClasses(params: { ageCategoryId?: string; gender?: Gender } = {}): Promise<ListResult<WeightClass>> {
  const data = await api<BaseData>("/api/v1/base-data");
  const filtered = data.weightClasses.filter(
    (item) =>
      (params.ageCategoryId === undefined || item.ageCategoryId === params.ageCategoryId) &&
      (params.gender === undefined || item.gender === params.gender),
  );

  return paginate(filtered);
}
