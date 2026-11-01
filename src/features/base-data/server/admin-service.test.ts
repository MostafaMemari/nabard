import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { UserIdentityRecord } from "./admin-repository";
import { type AgeCategoriesAdminRepository, getAgeCategory, updateAgeCategoryDates } from "./admin-service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };

const superAdminRecord: UserIdentityRecord = { id: "super-1", role: "SUPER_ADMIN", province: null, isActive: true };

const seniorCategory = {
  id: "senior",
  name: "SENIOR" as const,
  startDate: new Date("1990-01-01T00:00:00.000Z"),
  endDate: new Date("2005-12-31T00:00:00.000Z"),
  birthYearStart: 1990,
  birthYearEnd: 2005,
};

function repoWith(overrides: Partial<AgeCategoriesAdminRepository> = {}) {
  return {
    findUserById: vi.fn().mockResolvedValue(superAdminRecord),
    findAgeCategoryById: vi.fn().mockResolvedValue(seniorCategory),
    countPublishedCompetitionRegistrations: vi.fn().mockResolvedValue(0),
    updateAgeCategoryDates: vi.fn().mockResolvedValue({ ...seniorCategory, startDate: new Date("1991-01-01T00:00:00.000Z") }),
    ...overrides,
  };
}

function auditWith(entries: AuditEntry[] = []): AuditRepository & { entries: AuditEntry[] } {
  return {
    entries,
    createAuditLog: vi.fn().mockImplementation(async (entry: AuditEntry) => {
      entries.push(entry);
    }),
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("getAgeCategory", () => {
  it("returns the age category to a super admin", async () => {
    const repo = repoWith();
    const result = await getAgeCategory(repo, superAdmin, "senior");

    expect(result).toEqual(seniorCategory);
  });

  it("rejects an ADMIN with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(getAgeCategory(repo, admin, "senior"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findAgeCategoryById).not.toHaveBeenCalled();
  });

  it("keeps an unknown category behind 404", async () => {
    const repo = repoWith({ findAgeCategoryById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getAgeCategory(repo, superAdmin, "nope"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("updateAgeCategoryDates", () => {
  const input = { startDate: "1991-01-01T00:00:00.000Z", endDate: "2005-12-31T00:00:00.000Z" };

  it("changes the dates and writes an audit entry with the previous and next range", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await updateAgeCategoryDates(repo, audit, superAdmin, "senior", input);

    expect(repo.updateAgeCategoryDates).toHaveBeenCalledWith("senior", {
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    });
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorId: "super-1",
      action: "age_category.dates_changed",
      entityType: "age_category",
      entityId: "senior",
      details: {
        name: "SENIOR",
        previous: { startDate: seniorCategory.startDate.toISOString(), endDate: seniorCategory.endDate.toISOString() },
        next: { startDate: input.startDate, endDate: input.endDate },
      },
    });
    expect(result.startDate).toEqual(new Date("1991-01-01T00:00:00.000Z"));
  });

  it("blocks the change when a published competition of the category has registrations", async () => {
    const repo = repoWith({ countPublishedCompetitionRegistrations: vi.fn().mockResolvedValue(4) });
    const audit = auditWith();
    const failure = await failureOf(updateAgeCategoryDates(repo, audit, superAdmin, "senior", input));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قابل تغییر نیست");
    expect(repo.updateAgeCategoryDates).not.toHaveBeenCalled();
    expect(audit.entries).toHaveLength(0);
  });

  it("ignores registrations of draft and canceled competitions", async () => {
    const repo = repoWith({ countPublishedCompetitionRegistrations: vi.fn().mockResolvedValue(0) });
    const audit = auditWith();
    await updateAgeCategoryDates(repo, audit, superAdmin, "senior", input);

    expect(repo.updateAgeCategoryDates).toHaveBeenCalled();
    expect(audit.entries).toHaveLength(1);
  });

  it("rejects an end date before the start date with 400", async () => {
    const repo = repoWith();
    const failure = await failureOf(
      updateAgeCategoryDates(repo, auditWith(), superAdmin, "senior", {
        startDate: "2006-01-01T00:00:00.000Z",
        endDate: "2005-12-31T00:00:00.000Z",
      }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.updateAgeCategoryDates).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateAgeCategoryDates(repo, auditWith(), admin, "senior", input));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateAgeCategoryDates).not.toHaveBeenCalled();
  });
});
