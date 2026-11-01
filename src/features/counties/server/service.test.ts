import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { CountiesRepository, UserIdentityRecord } from "./repository";
import { createCounty, deleteCounty, listCounties, updateCounty } from "./service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };

const superAdminRecord: UserIdentityRecord = { id: "super-1", role: "SUPER_ADMIN", province: null, isActive: true };
const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true };

const tehranCounty = { id: "county-tehran", province: "TEHRAN" as const, name: "تهران" };
const rayCounty = { id: "county-ray", province: "TEHRAN" as const, name: "ری" };
const shirazCounty = { id: "county-shiraz", province: "FARS" as const, name: "شیراز" };

function repoWith(overrides: Partial<CountiesRepository> = {}): CountiesRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(superAdminRecord),
    findCountiesByProvince: vi.fn().mockResolvedValue([tehranCounty, rayCounty]),
    findAllCounties: vi.fn().mockResolvedValue([tehranCounty, rayCounty, shirazCounty]),
    findCountyById: vi
      .fn()
      .mockImplementation(async (id: string) => [tehranCounty, rayCounty, shirazCounty].find((county) => county.id === id) ?? null),
    countCountyCoaches: vi.fn().mockResolvedValue(0),
    countCountyCompetitions: vi.fn().mockResolvedValue(0),
    countCountyChangeRequests: vi.fn().mockResolvedValue(0),
    createCounty: vi.fn().mockResolvedValue(rayCounty),
    updateCounty: vi.fn().mockResolvedValue({ ...rayCounty, name: "ری نو" }),
    deleteCounty: vi.fn().mockResolvedValue(undefined),
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

describe("listCounties", () => {
  it("returns all counties for a super admin", async () => {
    const repo = repoWith();
    const result = await listCounties(repo, superAdmin, {});

    expect(repo.findAllCounties).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([tehranCounty, rayCounty, shirazCounty]);
  });

  it("filters by the province query for a super admin", async () => {
    const repo = repoWith();
    await listCounties(repo, superAdmin, { province: "TEHRAN" });

    expect(repo.findAllCounties).toHaveBeenCalledWith("TEHRAN");
  });

  it("keeps province scoping for an admin", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await listCounties(repo, admin, {});

    expect(repo.findCountiesByProvince).toHaveBeenCalledWith("TEHRAN");
    expect(result).toEqual([tehranCounty, rayCounty]);
  });
});

describe("createCounty", () => {
  it("creates a county and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await createCounty(repo, audit, superAdmin, { province: "TEHRAN", name: "ورامین" });

    expect(repo.createCounty).toHaveBeenCalledWith({ province: "TEHRAN", name: "ورامین" });
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorId: "super-1",
      action: "county.created",
      entityType: "county",
      entityId: "county-ray",
      details: { province: "TEHRAN", name: "ری" },
    });
    expect(result).toEqual(rayCounty);
  });

  it("rejects a duplicate name in the same province with 409", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCounty(repo, auditWith(), superAdmin, { province: "TEHRAN", name: "تهران" }));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createCounty).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCounty(repo, auditWith(), admin, { province: "TEHRAN", name: "ورامین" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createCounty).not.toHaveBeenCalled();
  });
});

describe("updateCounty", () => {
  it("renames a county and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await updateCounty(repo, audit, superAdmin, "county-ray", { name: "ری نو" });

    expect(repo.updateCounty).toHaveBeenCalledWith("county-ray", { name: "ری نو" });
    expect(audit.entries[0]).toMatchObject({ action: "county.updated", entityId: "county-ray", details: { name: "ری نو" } });
    expect(result).toEqual({ ...rayCounty, name: "ری نو" });
  });

  it("rejects a rename that collides with another county of the same province with 409", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateCounty(repo, auditWith(), superAdmin, "county-ray", { name: "تهران" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCounty).not.toHaveBeenCalled();
  });

  it("keeps an unknown county behind 404", async () => {
    const repo = repoWith({ findCountyById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(updateCounty(repo, auditWith(), superAdmin, "county-nope", { name: "نام" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("deleteCounty", () => {
  it("deletes an unused county and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await deleteCounty(repo, audit, superAdmin, "county-ray");

    expect(repo.deleteCounty).toHaveBeenCalledWith("county-ray");
    expect(audit.entries[0]).toMatchObject({ action: "county.deleted", entityId: "county-ray" });
    expect(result).toEqual({ id: "county-ray" });
  });

  it("blocks deletion when coaches use the county with a Persian message", async () => {
    const repo = repoWith({ countCountyCoaches: vi.fn().mockResolvedValue(3) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), superAdmin, "county-ray"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قابل حذف نیست");
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("blocks deletion when a competition uses the county", async () => {
    const repo = repoWith({ countCountyCompetitions: vi.fn().mockResolvedValue(1) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), superAdmin, "county-ray"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("blocks deletion when county change requests reference the county", async () => {
    const repo = repoWith({ countCountyChangeRequests: vi.fn().mockResolvedValue(2) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), superAdmin, "county-ray"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(deleteCounty(repo, auditWith(), admin, "county-ray"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });
});
