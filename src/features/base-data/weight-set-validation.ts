import type { WeightClassSetIssue, WeightClassSetRow } from "./types";

const WEIGHT_EPSILON = 1e-9;

function numbersEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < WEIGHT_EPSILON;
}

function rowIssues(index: number, row: WeightClassSetRow): WeightClassSetIssue[] {
  const issues: WeightClassSetIssue[] = [];

  if (row.label.trim().length === 0) {
    issues.push({ index, field: "label", message: "برچسب رده وزنی را وارد کنید." });
  }

  if (!Number.isFinite(row.minWeightKg) || row.minWeightKg < 0) {
    issues.push({ index, field: "minWeightKg", message: "حداقل وزن را به کیلوگرم وارد کنید." });
  }

  if (row.maxWeightKg !== null && (!Number.isFinite(row.maxWeightKg) || row.maxWeightKg <= row.minWeightKg)) {
    issues.push({ index, field: "maxWeightKg", message: "حداکثر وزن باید بیشتر از حداقل وزن باشد." });
  }

  return issues;
}

export function validateWeightClassSet(rows: WeightClassSetRow[]): WeightClassSetIssue[] {
  if (rows.length === 0) {
    return [{ index: null, field: "rows", message: "حداقل یک رده وزنی لازم است." }];
  }

  const issues: WeightClassSetIssue[] = [];
  const labelOwners = new Map<string, number>();

  rows.forEach((row, index) => {
    issues.push(...rowIssues(index, row));

    const label = row.label.trim();
    if (label.length === 0) return;
    const previous = labelOwners.get(label);
    if (previous === undefined) {
      labelOwners.set(label, index);
    } else {
      issues.push({ index, field: "label", message: `برچسب رده وزنی با ردیف ${previous + 1} تکراری است.` });
    }
  });

  const sorted = rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => left.row.minWeightKg - right.row.minWeightKg || left.index - right.index);

  sorted.forEach(({ row, index }, position) => {
    if (Number.isFinite(row.minWeightKg) && row.minWeightKg < 0) return;

    if (position === 0 && !numbersEqual(row.minWeightKg, 0)) {
      issues.push({ index, field: "minWeightKg", message: "حداقل وزن اولین رده باید صفر باشد." });
    }

    if (row.maxWeightKg === null && position !== sorted.length - 1) {
      issues.push({ index, field: "maxWeightKg", message: "فقط آخرین رده می تواند بدون حداکثر وزن باشد." });
    }

    if (position > 0) {
      const previous = sorted[position - 1];
      if (
        previous.row.maxWeightKg !== null &&
        Number.isFinite(row.minWeightKg) &&
        !numbersEqual(row.minWeightKg, previous.row.maxWeightKg)
      ) {
        issues.push({ index, field: "minWeightKg", message: "حداقل این رده باید برابر حداکثر رده قبلی باشد." });
      }
    }
  });

  sorted.forEach(({ row, index }, position) => {
    if (position === 0) return;
    const previous = sorted[position - 1];
    if (previous.row.maxWeightKg === null || !Number.isFinite(row.minWeightKg)) return;
    if (!numbersEqual(row.minWeightKg, previous.row.maxWeightKg)) return;

    if (previous.row.excludeMax === row.excludeMin) {
      issues.push({
        index,
        field: "excludeMax",
        message: "وزن دقیقا روی مرز مشترک باید فقط در یکی از دو رده قرار گیرد؛ یکی از دو گزینه «شامل مرز» را تغییر دهید.",
      });
    }
  });

  return issues;
}

export function sortWeightClassSetRows(rows: WeightClassSetRow[]): WeightClassSetRow[] {
  return [...rows]
    .map((row, index) => ({ row, index }))
    .sort((left, right) => left.row.minWeightKg - right.row.minWeightKg || left.index - right.index)
    .map((item) => item.row);
}
