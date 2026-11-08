import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { AnalyticsRepository } from "./repository";
import { getSuperAnalytics } from "./service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };

const superAdminRecord = { id: "super-1", role: "SUPER_ADMIN" as const, isActive: true };

// 2026-11-09T08:00Z is Aban 1405 in Tehran; the trend window is 1404-09..1405-08.
const now = new Date("2026-11-09T08:00:00Z");

function repoWith(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  const repo: AnalyticsRepository = {
    findUserById: vi.fn().mockResolvedValue(superAdminRecord),
    countCoaches: vi.fn().mockResolvedValue(12),
    countStudents: vi.fn().mockResolvedValue(220),
    countCompetitions: vi.fn().mockResolvedValue(9),
    countRegistrations: vi.fn().mockResolvedValue(180),
    countProfilesByStatus: vi.fn().mockResolvedValue({ approved: 150, pending: 50, rejected: 20 }),
    findRecentRegistrationDates: vi.fn().mockResolvedValue([
      new Date("2026-11-01T10:00:00Z"), // 1405-08
      new Date("2026-10-22T19:00:00Z"), // 1405-07
      new Date("2026-10-23T06:00:00Z"), // 1405-08
      new Date("2026-03-25T10:00:00Z"), // 1405-01
      new Date("2020-01-01T00:00:00Z"), // outside the window
    ]),
    countRegistrationsByCounty: vi.fn().mockResolvedValue([
      { countyId: "c1", count: 12 },
      { countyId: "c2", count: 7 },
      { countyId: "c3", count: 3 },
      { countyId: "ghost", count: 5 },
    ]),
    countStudentsByCounty: vi.fn().mockResolvedValue([
      { countyId: "c1", count: 30 },
      { countyId: "c2", count: 10 },
      { countyId: "c5", count: 4 },
    ]),
    findCounties: vi.fn().mockResolvedValue([
      { id: "c1", name: "شهرستان یک", province: "TEHRAN" },
      { id: "c2", name: "شهرستان دو", province: "TEHRAN" },
      { id: "c3", name: "شهرستان سه", province: "TEHRAN" },
      { id: "c5", name: "شهرستان پنج", province: "TEHRAN" },
    ]),
  };

  return { ...repo, ...overrides };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("getSuperAnalytics", () => {
  it("aggregates kpis, trend and county stats for a super admin", async () => {
    const repo = repoWith();
    const result = await getSuperAnalytics(repo, superAdmin, null, now);

    expect(result.kpis).toEqual({ students: 220, registrations: 180, coaches: 12, competitions: 9 });
    expect(result.profiles).toEqual({ approved: 150, pending: 50, rejected: 20 });
    expect(result.province).toBeNull();

    expect(result.trend).toHaveLength(12);
    expect(result.trend[0]).toMatchObject({ key: "1404-09", count: 0 });
    expect(result.trend.at(-1)).toMatchObject({ key: "1405-08", label: "آبان", year: 1405, count: 2 });
    expect(result.trend.find((point) => point.key === "1405-07")?.count).toBe(1);
    expect(result.trend.find((point) => point.key === "1405-01")?.count).toBe(1);
    expect(result.trend.reduce((sum, point) => sum + point.count, 0)).toBe(4);

    expect(result.counties).toEqual([
      { id: "c1", name: "شهرستان یک", province: "TEHRAN", registrations: 12, students: 30 },
      { id: "c2", name: "شهرستان دو", province: "TEHRAN", registrations: 7, students: 10 },
      { id: "c3", name: "شهرستان سه", province: "TEHRAN", registrations: 3, students: 0 },
      { id: "c5", name: "شهرستان پنج", province: "TEHRAN", registrations: 0, students: 4 },
    ]);
    expect(result.hiddenCounties).toBe(0);
  });

  it("keeps only the top counties and reports the hidden rest", async () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({ countyId: `c${index}`, count: 10 - index }));
    const counties = rows.map((row) => ({ id: row.countyId, name: `شهرستان ${row.countyId}`, province: "TEHRAN" as const }));
    const repo = repoWith({
      countRegistrationsByCounty: vi.fn().mockResolvedValue(rows),
      countStudentsByCounty: vi.fn().mockResolvedValue([]),
      findCounties: vi.fn().mockResolvedValue(counties),
    });

    const result = await getSuperAnalytics(repo, superAdmin, null, now);

    expect(result.counties).toHaveLength(8);
    expect(result.counties[0]).toMatchObject({ id: "c0", registrations: 10, students: 0 });
    expect(result.hiddenCounties).toBe(2);
  });

  it("passes the province filter to every query", async () => {
    const repo = repoWith();
    await getSuperAnalytics(repo, superAdmin, "TEHRAN", now);

    expect(repo.countStudents).toHaveBeenCalledWith("TEHRAN");
    expect(repo.countRegistrations).toHaveBeenCalledWith("TEHRAN");
    expect(repo.findCounties).toHaveBeenCalledWith("TEHRAN");
    expect(repo.findRecentRegistrationDates).toHaveBeenCalledWith("TEHRAN", expect.any(Date));
    expect(repo.countRegistrationsByCounty).toHaveBeenCalledWith("TEHRAN");
    expect(repo.countStudentsByCounty).toHaveBeenCalledWith("TEHRAN");
  });

  it("rejects an ADMIN with 403 without querying", async () => {
    const repo = repoWith();
    const failure = await failureOf(getSuperAnalytics(repo, admin, null, now));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.countStudents).not.toHaveBeenCalled();
  });

  it("rejects when the super admin row is gone with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getSuperAnalytics(repo, superAdmin, null, now));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("rejects an inactive super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...superAdminRecord, isActive: false }) });
    const failure = await failureOf(getSuperAnalytics(repo, superAdmin, null, now));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("rejects an unknown province with 400", async () => {
    const repo = repoWith();
    const failure = await failureOf(getSuperAnalytics(repo, superAdmin, "NOWHERE", now));

    expect(failure).toMatchObject({ status: 400, code: "INVALID_PROVINCE" });
  });
});
