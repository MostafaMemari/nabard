"use client";

import { getDate, getDaysInMonth, getMonth, getYear, newDate } from "date-fns-jalali";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toPersianDigits } from "@/lib/format";

const monthLabels = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const firstYear = 1395;
const lastYear = 1412;

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function selectItems(values: number[], label: (value: number) => string): Record<string, string> {
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

  const triggerClass = "w-full justify-between";
  const dayItems = selectItems(range(1, daysInMonth), (item) => toPersianDigits(item));
  const monthItems = Object.fromEntries(monthLabels.map((label, index) => [String(index), label]));
  const yearItems = selectItems(range(firstYear, lastYear), (item) => toPersianDigits(item));

  return (
    <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2">
      <Select
        items={dayItems}
        value={day !== null ? String(day) : ""}
        onValueChange={(next) => update("day", String(next))}
        disabled={disabled}
      >
        <SelectTrigger aria-label="روز" className={triggerClass}>
          <SelectValue placeholder="روز" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(dayItems).map((item) => (
            <SelectItem key={item} value={item}>
              {dayItems[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={monthItems}
        value={month !== null ? String(month) : ""}
        onValueChange={(next) => update("month", String(next))}
        disabled={disabled}
      >
        <SelectTrigger aria-label="ماه" className={triggerClass}>
          <SelectValue placeholder="ماه" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(monthItems).map((item) => (
            <SelectItem key={item} value={item}>
              {monthItems[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={yearItems}
        value={year !== null ? String(year) : ""}
        onValueChange={(next) => update("year", String(next))}
        disabled={disabled}
      >
        <SelectTrigger aria-label="سال" className={triggerClass}>
          <SelectValue placeholder="سال" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(yearItems).map((item) => (
            <SelectItem key={item} value={item}>
              {yearItems[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
