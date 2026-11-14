"use client";

import { getDate, getDaysInMonth, getMonth, getYear, isValid, newDate } from "date-fns-jalali";
import { useEffect, useState } from "react";
import { toPersianDigits } from "@/lib/format";
import { DatePartSelect } from "./date-part-select";

const monthLabels = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const defaultFirstYear = 1395;
const defaultLastYear = 1412;

type DateParts = { year: number | null; month: number | null; day: number | null };

function partsOf(value: string): DateParts {
  const parsed = new Date(value);
  if (!isValid(parsed)) return { year: null, month: null, day: null };
  return { year: getYear(parsed), month: getMonth(parsed), day: getDate(parsed) };
}

// A minimum bound always comes from a complete ISO date, so its parts are known.
function fullPartsOf(value: string): { year: number; month: number; day: number } | null {
  const parsed = new Date(value);
  if (!isValid(parsed)) return null;
  return { year: getYear(parsed), month: getMonth(parsed), day: getDate(parsed) };
}

// Selects can hand back cleared or non numeric values ("" or null) — never trust them.
function picked(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

function itemsMap(values: number[], label: (value: number) => string): Record<string, string> {
  return Object.fromEntries(values.map((value) => [String(value), label(value)]));
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

export function JalaliDateField({
  value,
  onChange,
  disabled,
  yearFrom = defaultFirstYear,
  yearTo = defaultLastYear,
  min,
}: {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  /** First selectable Jalali year — pass an older year for birth dates. */
  yearFrom?: number;
  /** Last selectable Jalali year — pass the current year for birth dates. */
  yearTo?: number;
  /** ISO date; options before it are disabled. Pass today for dates that must not be in the past. */
  min?: string;
}) {
  const [parts, setParts] = useState<DateParts>(() => (value ? partsOf(value) : { year: null, month: null, day: null }));

  useEffect(() => {
    setParts(value ? partsOf(value) : { year: null, month: null, day: null });
  }, [value]);

  const minParts = min ? fullPartsOf(min) : null;
  // Keep an existing (possibly past) value selectable in the year list even when min is set.
  const firstYear = Math.min(minParts ? Math.max(yearFrom, minParts.year) : yearFrom, parts.year ?? Number.POSITIVE_INFINITY);
  const daysInMonth = parts.year !== null && parts.month !== null ? getDaysInMonth(newDate(parts.year, parts.month, 1)) : 31;

  function monthDisabled(month: number): boolean {
    return minParts !== null && parts.year === minParts.year && month < minParts.month;
  }

  function dayDisabled(day: number): boolean {
    return minParts !== null && parts.year === minParts.year && parts.month === minParts.month && day < minParts.day;
  }

  function update(part: "day" | "month" | "year", raw: string) {
    const pickedValue = picked(raw);
    if (pickedValue === null) return;
    const next: DateParts = { ...parts, [part]: pickedValue };
    setParts(next);
    // Emit only a complete, valid date — partial picks stay local and the form
    // value stays empty so submit validation reports the missing date.
    if (next.year === null || next.month === null || next.day === null) return;
    const maxDay = getDaysInMonth(newDate(next.year, next.month, 1));
    const date = newDate(next.year, next.month, Math.min(next.day, maxDay));
    if (isValid(date)) {
      onChange(date.toISOString());
    }
  }

  return (
    <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2">
      <DatePartSelect
        items={itemsMap(range(1, daysInMonth), (item) => toPersianDigits(item))}
        disabledValues={range(1, daysInMonth).filter(dayDisabled).map(String)}
        value={parts.day !== null ? String(parts.day) : ""}
        placeholder="روز"
        onChange={(next) => update("day", next)}
        disabled={disabled}
      />
      <DatePartSelect
        items={Object.fromEntries(monthLabels.map((label, index) => [String(index), label]))}
        disabledValues={monthLabels.map((_, index) => String(index)).filter((item) => monthDisabled(Number(item)))}
        value={parts.month !== null ? String(parts.month) : ""}
        placeholder="ماه"
        onChange={(next) => update("month", next)}
        disabled={disabled}
      />
      <DatePartSelect
        items={itemsMap(range(firstYear, yearTo), (item) => toPersianDigits(item))}
        disabledValues={range(firstYear, yearTo)
          .filter((item) => minParts !== null && item < minParts.year)
          .map(String)}
        value={parts.year !== null ? String(parts.year) : ""}
        placeholder="سال"
        onChange={(next) => update("year", next)}
        disabled={disabled}
      />
    </div>
  );
}
