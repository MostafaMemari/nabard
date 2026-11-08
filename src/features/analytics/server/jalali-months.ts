// Jalali (Persian) month helpers used to bucket registrations per month.
// Everything is timezone-explicit (Asia/Tehran) so a registration lands in the
// same month whether the code runs on a local machine or a UTC server.

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export type JalaliMonth = { key: string; year: number; month: number };

const TEHRAN = "Asia/Tehran";

const monthKeyFormatter = new Intl.DateTimeFormat("en-US", {
  calendar: "persian",
  timeZone: TEHRAN,
  year: "numeric",
  month: "2-digit",
});

// Jalali month key of an instant, e.g. 2025-05-21T21:00:00Z -> "1404-03".
export function jalaliMonthKey(date: Date): JalaliMonth {
  const parts = monthKeyFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");

  return { key: `${year}-${String(month).padStart(2, "0")}`, year, month };
}

// The last `count` Jalali months ending with the month of `now`, oldest first.
export function lastJalaliMonths(count: number, now: Date): JalaliMonth[] {
  const current = jalaliMonthKey(now);
  const months: JalaliMonth[] = [];

  let year = current.year;
  let month = current.month;
  for (let index = 0; index < count; index += 1) {
    months.push({ key: `${year}-${String(month).padStart(2, "0")}`, year, month });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return months.reverse();
}

// A DB lower bound that is guaranteed to cover the last `count` Jalali months.
// Rows outside the rendered month keys are dropped when bucketing, so a wide
// margin is safe; the Jalali year is at most ~366 days.
export function trendSinceBound(count: number, now: Date): Date {
  const days = count * 31 + 40;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Counts per month key, oldest first, zero-filled for months without data.
export function bucketByJalaliMonth(months: JalaliMonth[], dates: Date[]): Map<string, number> {
  const wanted = new Set(months.map((month) => month.key));
  const counts = new Map<string, number>();
  for (const month of months) counts.set(month.key, 0);

  for (const date of dates) {
    const { key } = jalaliMonthKey(date);
    if (!wanted.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}
