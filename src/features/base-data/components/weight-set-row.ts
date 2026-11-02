"use client";

import type { WeightClassSetRowAdmin } from "../api-admin";
import type { WeightClassSetRow } from "../types";

export type EditorRow = {
  key: string;
  id?: string;
  label: string;
  min: string;
  max: string;
  excludeMin: boolean;
  excludeMax: boolean;
  archived: boolean;
};

export function parseWeight(value: string): number | null {
  const ascii = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d.]/g, "");
  if (ascii === "" || ascii === ".") return null;
  const parsed = Number.parseFloat(ascii);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toSetRow(row: EditorRow): WeightClassSetRow {
  const min = parseWeight(row.min);
  const max = parseWeight(row.max);

  return {
    id: row.id,
    label: row.label,
    minWeightKg: min ?? Number.NaN,
    maxWeightKg: row.max.trim() === "" ? null : (max ?? Number.NaN),
    excludeMin: row.excludeMin,
    excludeMax: row.excludeMax,
  };
}

export function rowOfAdmin(row: WeightClassSetRowAdmin): EditorRow {
  return {
    key: row.id,
    id: row.id,
    label: row.label,
    min: String(row.minWeightKg),
    max: row.maxWeightKg === null ? "" : String(row.maxWeightKg),
    excludeMin: row.excludeMin,
    excludeMax: row.excludeMax,
    archived: !row.isActive,
  };
}
