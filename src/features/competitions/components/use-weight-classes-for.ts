import type { WeightClass } from "@/features/base-data";
import { useWeightClasses } from "@/features/base-data";
import type { Competition } from "../types";

export function useWeightClassesFor(competition: Competition | undefined): { weightClasses: WeightClass[] } {
  const live = useWeightClasses(
    competition && !competition.rules ? { ageCategoryId: competition.ageCategoryId, gender: competition.gender } : {},
  );

  if (!competition) return { weightClasses: [] };

  return {
    weightClasses: competition.rules
      ? competition.rules.weightClasses.map((item) => toWeightClass(item, competition.gender))
      : live.weightClasses,
  };
}

function toWeightClass(
  weightClass: NonNullable<Competition["rules"]>["weightClasses"][number],
  gender: Competition["gender"],
): WeightClass {
  return {
    id: weightClass.id,
    ageCategoryId: "",
    gender,
    label: weightClass.label,
    minWeightKg: weightClass.min,
    maxWeightKg: weightClass.max,
    order: weightClass.order,
    excludeMin: weightClass.excludeMin,
    excludeMax: weightClass.excludeMax,
    isActive: true,
  };
}
