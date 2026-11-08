import { describe, expect, it } from "vitest";
import { bucketByJalaliMonth, jalaliMonthKey, lastJalaliMonths, trendSinceBound } from "./jalali-months";

describe("jalaliMonthKey", () => {
  it("buckets an instant by the Tehran calendar day month", () => {
    // 2025-05-21T19:30Z is 23:30 in Tehran on Ordibehesht 31, 1404.
    expect(jalaliMonthKey(new Date("2025-05-21T19:30:00Z")).key).toBe("1404-02");
    // Two hours later it is past midnight Tehran, Khordad 1.
    expect(jalaliMonthKey(new Date("2025-05-21T21:00:00Z")).key).toBe("1404-03");
  });

  it("crosses the Jalali year on Nowruz", () => {
    expect(jalaliMonthKey(new Date("2026-03-19T20:00:00Z")).key).toBe("1404-12");
    expect(jalaliMonthKey(new Date("2026-03-25T10:00:00Z")).key).toBe("1405-01");
  });
});

describe("lastJalaliMonths", () => {
  const now = new Date("2026-11-09T08:00:00Z"); // Aban 1405 in Tehran

  it("returns twelve months ending with the current one, oldest first", () => {
    const months = lastJalaliMonths(12, now);

    expect(months).toHaveLength(12);
    expect(months[0]).toMatchObject({ key: "1404-09", year: 1404, month: 9 });
    expect(months[11]).toMatchObject({ key: "1405-08", year: 1405, month: 8 });
  });

  it("wraps across the year boundary without gaps", () => {
    const months = lastJalaliMonths(12, now);
    const keys = months.map((month) => month.key);

    expect(keys).toContain("1404-12");
    expect(keys).toContain("1405-01");
    expect(new Set(keys).size).toBe(12);
  });
});

describe("trendSinceBound", () => {
  it("goes back far enough to cover twelve Jalali months", () => {
    const now = new Date("2026-11-09T08:00:00Z");
    const bound = trendSinceBound(12, now);

    expect(bound.getTime()).toBe(now.getTime() - 412 * 24 * 60 * 60 * 1000);
  });
});

describe("bucketByJalaliMonth", () => {
  const now = new Date("2026-11-09T08:00:00Z"); // Aban 1405

  it("counts dates per month and drops rows outside the window", () => {
    const months = lastJalaliMonths(12, now);
    const dates = [
      new Date("2026-11-01T10:00:00Z"), // 1405-08
      new Date("2026-10-22T19:00:00Z"), // 1405-07 (still Mehr in Tehran)
      new Date("2026-10-23T06:00:00Z"), // 1405-08 (Aban 1 in Tehran)
      new Date("2026-03-25T10:00:00Z"), // 1405-01
      new Date("2020-01-01T00:00:00Z"), // far outside
    ];

    const counts = bucketByJalaliMonth(months, dates);

    expect(counts.get("1405-08")).toBe(2);
    expect(counts.get("1405-07")).toBe(1);
    expect(counts.get("1405-01")).toBe(1);
    expect(counts.get("1404-09")).toBe(0);
    expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(4);
  });
});
