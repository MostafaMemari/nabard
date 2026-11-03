"use client";

import { getDate, getDaysInMonth, getMonth, getYear, newDate } from "date-fns-jalali";
import { toPersianDigits } from "@/lib/format";
import { DatePartSelect } from "./date-part-select";

const monthLabels = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const firstYear = 1395;
const lastYear = 1412;

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function itemsMap(values: number[], label: (value: number) => string): Record<string, string> {
  return Object.fromEntries(values.map((value) => [String(value), label(value)]));
}

export function JalaliDateField({ value, onChange, disabled }: { value: string; onChange: (iso: string) => void; disabled?: boolean }) {
  const parsed = value ? new Date(value) : null;
  const year = parsed ? getYear(parsed) : null;
  const month = parsed ? getMonth(parsed) : null;
  const day = parsed ? getDate(parsed) : null;
  const daysInMonth = year !== null && month !== null ? getDaysInMonth(newDate(year, month, 1)) : 31;

  function update(part: "day" | "month" | "year", raw: string) {
    const nextYear = part === "year" ? Number(raw) : (year ?? firstYear);
    const nextMonth = part === "month" ? Number(raw) : (month ?? 0);
    const maxDay = getDaysInMonth(newDate(nextYear, nextMonth, 1));
    const nextDay = part === "day" ? Number(raw) : Math.min(day ?? 1, maxDay);
    onChange(newDate(nextYear, nextMonth, nextDay).toISOString());
  }

  return (
    <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2">
      <DatePartSelect
        items={itemsMap(range(1, daysInMonth), (item) => toPersianDigits(item))}
        value={day !== null ? String(day) : ""}
        placeholder="روز"
        onChange={(next) => update("day", next)}
        disabled={disabled}
      />
      <DatePartSelect
        items={Object.fromEntries(monthLabels.map((label, index) => [String(index), label]))}
        value={month !== null ? String(month) : ""}
        placeholder="ماه"
        onChange={(next) => update("month", next)}
        disabled={disabled}
      />
      <DatePartSelect
        items={itemsMap(range(firstYear, lastYear), (item) => toPersianDigits(item))}
        value={year !== null ? String(year) : ""}
        placeholder="سال"
        onChange={(next) => update("year", next)}
        disabled={disabled}
      />
    </div>
  );
}
