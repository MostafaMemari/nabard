import type { Belt, WeightClass } from "../types";
import type * as repository from "./repository";
import type { AgeCategoryRecord } from "./repository";

export type BaseDataResult = {
  belts: Belt[];
  ageCategories: AgeCategoryRecord[];
  weightClasses: WeightClass[];
};

export async function getBaseData(repo: typeof repository): Promise<BaseDataResult> {
  const [belts, ageCategories, weightClasses] = await Promise.all([
    repo.findAllBelts(),
    repo.findAllAgeCategories(),
    repo.findAllWeightClasses(),
  ]);

  return { belts, ageCategories, weightClasses };
}
