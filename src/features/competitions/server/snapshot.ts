import type { CompetitionRulesSnapshot } from "../types";

type NumericLike = number | { toNumber(): number };

function toNumber(value: NumericLike): number {
  return typeof value === "number" ? value : value.toNumber();
}

export type SnapshotSourceRows = {
  ageCategory: { id: string; code: string; label: string; startDate: Date | string; endDate: Date | string };
  minBelt: { id: string; code: string; label: string; level: number };
  maxBelt: { id: string; code: string; label: string; level: number };
  weightClasses: Array<{
    id: string;
    label: string;
    minWeightKg: NumericLike;
    maxWeightKg: NumericLike | null;
    excludeMin: boolean;
    excludeMax: boolean;
    order: number;
  }>;
};

export function buildRulesSnapshot(source: SnapshotSourceRows): CompetitionRulesSnapshot {
  return {
    ageCategory: {
      id: source.ageCategory.id,
      code: source.ageCategory.code,
      label: source.ageCategory.label,
      startDate: new Date(source.ageCategory.startDate).toISOString(),
      endDate: new Date(source.ageCategory.endDate).toISOString(),
    },
    minBelt: { id: source.minBelt.id, code: source.minBelt.code, label: source.minBelt.label, level: source.minBelt.level },
    maxBelt: { id: source.maxBelt.id, code: source.maxBelt.code, label: source.maxBelt.label, level: source.maxBelt.level },
    weightClasses: source.weightClasses.map((weightClass) => ({
      id: weightClass.id,
      label: weightClass.label,
      min: toNumber(weightClass.minWeightKg),
      max: weightClass.maxWeightKg === null ? null : toNumber(weightClass.maxWeightKg),
      excludeMin: weightClass.excludeMin,
      excludeMax: weightClass.excludeMax,
      order: weightClass.order,
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBelt(value: unknown): CompetitionRulesSnapshot["minBelt"] | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.code !== "string" ||
    typeof value.label !== "string" ||
    typeof value.level !== "number"
  ) {
    return null;
  }

  return { id: value.id, code: value.code, label: value.label, level: value.level };
}

function parseWeightClass(value: unknown): CompetitionRulesSnapshot["weightClasses"][number] | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.label !== "string" ||
    typeof value.min !== "number" ||
    (value.max !== null && typeof value.max !== "number") ||
    typeof value.excludeMin !== "boolean" ||
    typeof value.excludeMax !== "boolean" ||
    typeof value.order !== "number"
  ) {
    return null;
  }

  return {
    id: value.id,
    label: value.label,
    min: value.min,
    max: value.max,
    excludeMin: value.excludeMin,
    excludeMax: value.excludeMax,
    order: value.order,
  };
}

// The column is written by the publish transaction and by the migration backfill;
// a broken or missing value falls back to null so live data is used instead.
export function parseRulesSnapshot(value: unknown): CompetitionRulesSnapshot | null {
  if (!isRecord(value)) return null;

  const ageCategory = value.ageCategory;
  if (!isRecord(ageCategory)) return null;
  if (
    typeof ageCategory.id !== "string" ||
    typeof ageCategory.code !== "string" ||
    typeof ageCategory.label !== "string" ||
    typeof ageCategory.startDate !== "string" ||
    typeof ageCategory.endDate !== "string"
  ) {
    return null;
  }

  const minBelt = parseBelt(value.minBelt);
  const maxBelt = parseBelt(value.maxBelt);
  if (!minBelt || !maxBelt) return null;

  if (!Array.isArray(value.weightClasses)) return null;
  const weightClasses: CompetitionRulesSnapshot["weightClasses"] = [];
  for (const item of value.weightClasses) {
    const weightClass = parseWeightClass(item);
    if (weightClass === null) return null;
    weightClasses.push(weightClass);
  }

  return {
    ageCategory: {
      id: ageCategory.id,
      code: ageCategory.code,
      label: ageCategory.label,
      startDate: ageCategory.startDate,
      endDate: ageCategory.endDate,
    },
    minBelt,
    maxBelt,
    weightClasses,
  };
}
