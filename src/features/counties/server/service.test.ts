import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import { defaultCounties } from "../default-counties";
import type { CountiesRepository, UserIdentityRecord } from "./repository";
import { addDefaultCounties, createCounty, deleteCounty, listCounties, updateCounty } from "./service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true };
const farsAdminRecord: UserIdentityRecord = { id: "admin-fars", role: "ADMIN", province: "FARS", isActive: true };
const farsAdmin: CurrentUser = { id: "admin-fars", role: "ADMIN" };
const coachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", province: "TEHRAN", isActive: true };
const superAdminRecord: UserIdentityRecord = { id: "super-1", role: "SUPER_ADMIN", province: null, isActive: true };

const tehranCounty = { id: "county-tehran", province: "TEHRAN" as const, name: "تهران" };
const rayCounty = { id: "county-ray", province: "TEHRAN" as const, name: "ری" };
const shirazCounty = { id: "county-shiraz", province: "FARS" as const, name: "شیراز" };

function repoWith(overrides: Partial<CountiesRepository> = {}): CountiesRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(adminRecord),
    findCountiesByProvince: vi.fn().mockResolvedValue([tehranCounty, rayCounty]),
    findAllCounties: vi.fn().mockResolvedValue([tehranCounty, rayCounty, shirazCounty]),
    findCountyById: vi
      .fn()
      .mockImplementation(async (id: string) => [tehranCounty, rayCounty, shirazCounty].find((county) => county.id === id) ?? null),
    countCountyCoaches: vi.fn().mockResolvedValue(0),
    countCountyCompetitions: vi.fn().mockResolvedValue(0),
    countCountyChangeRequests: vi.fn().mockResolvedValue(0),
    createCounty: vi.fn().mockImplementation(async (data: { province: string; name: string }) => ({
      id: `county-${data.name}`,
      province: data.province,
      name: data.name,
    })),
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
  it("returns all counties for a super admin with an optional province filter", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const all = await listCounties(repo, superAdmin, {});

    expect(repo.findAllCounties).toHaveBeenCalledWith(undefined);
    expect(all).toEqual([tehranCounty, rayCounty, shirazCounty]);

    await listCounties(repo, superAdmin, { province: "TEHRAN" });
    expect(repo.findAllCounties).toHaveBeenLastCalledWith("TEHRAN");
  });

  it("keeps province scoping for an admin", async () => {
    const repo = repoWith();
    const result = await listCounties(repo, admin, {});

    expect(repo.findCountiesByProvince).toHaveBeenCalledWith("TEHRAN");
    expect(result).toEqual([tehranCounty, rayCounty]);
  });

  it("keeps read access for a coach of the same province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(coachRecord) });
    const result = await listCounties(repo, coach, {});

    expect(repo.findCountiesByProvince).toHaveBeenCalledWith("TEHRAN");
    expect(result).toEqual([tehranCounty, rayCounty]);
  });
});

describe("createCounty", () => {
  it("creates a county in the admin province and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await createCounty(repo, audit, admin, { name: "ورامین" });

    expect(repo.createCounty).toHaveBeenCalledWith({ province: "TEHRAN", name: "ورامین" });
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorId: "admin-1",
      action: "county.created",
      entityType: "county",
      entityId: "county-ورامین",
      details: { province: "TEHRAN", name: "ورامین" },
    });
    expect(result).toEqual({ id: "county-ورامین", province: "TEHRAN", name: "ورامین" });
  });

  it("ignores a foreign province in the input and always uses the admin province", async () => {
    const repo = repoWith();
    await createCounty(repo, auditWith(), admin, { province: "FARS", name: "ورامین" });

    expect(repo.createCounty).toHaveBeenCalledWith({ province: "TEHRAN", name: "ورامین" });
  });

  it("rejects a duplicate name in the same province with 409", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCounty(repo, auditWith(), admin, { name: "تهران" }));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createCounty).not.toHaveBeenCalled();
  });

  it("detects a duplicate after normalizing Arabic ye, kaf and ZWNJ", async () => {
    const repo = repoWith({ findCountiesByProvince: vi.fn().mockResolvedValue([{ id: "c1", province: "TEHRAN", name: "رباط‌کریم" }]) });
    const failure = await failureOf(createCounty(repo, auditWith(), admin, { name: "رباط كريم" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createCounty).not.toHaveBeenCalled();
  });

  it("rejects a super admin with 403 because writes belong to admins", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(createCounty(repo, auditWith(), superAdmin, { name: "ورامین" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createCounty).not.toHaveBeenCalled();
  });
});

describe("updateCounty", () => {
  it("renames a county of the admin province and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await updateCounty(repo, audit, admin, "county-ray", { name: "ری نو" });

    expect(repo.updateCounty).toHaveBeenCalledWith("county-ray", { name: "ری نو" });
    expect(audit.entries[0]).toMatchObject({ action: "county.updated", entityId: "county-ray", details: { name: "ری نو" } });
    expect(result).toEqual({ ...rayCounty, name: "ری نو" });
  });

  it("keeps another province county behind 404", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateCounty(repo, auditWith(), admin, "county-shiraz", { name: "شیراز نو" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateCounty).not.toHaveBeenCalled();
  });

  it("rejects a rename that collides with another county of the same province with 409", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateCounty(repo, auditWith(), admin, "county-ray", { name: "تهران" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCounty).not.toHaveBeenCalled();
  });

  it("rejects a super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(updateCounty(repo, auditWith(), superAdmin, "county-ray", { name: "ری نو" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateCounty).not.toHaveBeenCalled();
  });
});

describe("deleteCounty", () => {
  it("deletes an unused county of the admin province and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await deleteCounty(repo, audit, admin, "county-ray");

    expect(repo.deleteCounty).toHaveBeenCalledWith("county-ray");
    expect(audit.entries[0]).toMatchObject({ action: "county.deleted", entityId: "county-ray" });
    expect(result).toEqual({ id: "county-ray" });
  });

  it("keeps another province county behind 404", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(farsAdminRecord) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), farsAdmin, "county-ray"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("blocks deletion when coaches use the county with a Persian message", async () => {
    const repo = repoWith({ countCountyCoaches: vi.fn().mockResolvedValue(3) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), admin, "county-ray"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قابل حذف نیست");
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("blocks deletion when a competition uses the county", async () => {
    const repo = repoWith({ countCountyCompetitions: vi.fn().mockResolvedValue(1) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), admin, "county-ray"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("blocks deletion when county change requests reference the county", async () => {
    const repo = repoWith({ countCountyChangeRequests: vi.fn().mockResolvedValue(2) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), admin, "county-ray"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("rejects a super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(deleteCounty(repo, auditWith(), superAdmin, "county-ray"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });
});

describe("addDefaultCounties", () => {
  it("inserts only the missing default counties of the admin province", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await addDefaultCounties(repo, audit, admin);

    expect(repo.createCounty).toHaveBeenCalledTimes(defaultCounties.TEHRAN.length - 2);
    expect(repo.createCounty).toHaveBeenCalledWith({ province: "TEHRAN", name: "اسلامشهر" });
    expect(audit.entries[0]).toMatchObject({
      action: "county.defaults_added",
      entityType: "county",
      details: { province: "TEHRAN", added: defaultCounties.TEHRAN.length - 2, total: defaultCounties.TEHRAN.length },
    });
    expect(result.added).toBe(defaultCounties.TEHRAN.length - 2);
  });

  it("is idempotent and adds nothing when every default county already exists", async () => {
    const repo = repoWith({
      findCountiesByProvince: vi
        .fn()
        .mockResolvedValue(defaultCounties.TEHRAN.map((name, index) => ({ id: `county-${index}`, province: "TEHRAN", name }))),
    });
    const audit = auditWith();
    const result = await addDefaultCounties(repo, audit, admin);

    expect(repo.createCounty).not.toHaveBeenCalled();
    expect(result.added).toBe(0);
  });

  it("normalizes Arabic ye, kaf and ZWNJ before comparing with existing counties", async () => {
    const repo = repoWith({
      findCountiesByProvince: vi.fn().mockResolvedValue([
        { id: "c1", province: "TEHRAN", name: "رباط كريم" },
        { id: "c2", province: "TEHRAN", name: "تهران" },
      ]),
    });
    const result = await addDefaultCounties(repo, auditWith(), admin);

    const inserted = vi.mocked(repo.createCounty).mock.calls.map((call) => call[0].name);
    expect(inserted).not.toContain("رباط‌کریم");
    expect(result.added).toBe(defaultCounties.TEHRAN.length - 2);
  });

  it("keeps the existing seeded Tehran counties untouched", async () => {
    const seededTehran = [
      "اسلامشهر",
      "بهارستان",
      "پاکدشت",
      "پردیس",
      "پیشوا",
      "تهران",
      "دماوند",
      "رباط کریم",
      "ری",
      "شمیرانات",
      "شهریار",
      "فیروزکوه",
      "قدس",
      "قرچک",
      "ملارد",
      "ورامین",
    ];
    const repo = repoWith({
      findCountiesByProvince: vi
        .fn()
        .mockResolvedValue(seededTehran.map((name, index) => ({ id: `county-${index}`, province: "TEHRAN", name }))),
    });
    const result = await addDefaultCounties(repo, auditWith(), admin);

    expect(result.added).toBe(0);
    expect(repo.createCounty).not.toHaveBeenCalled();
    expect(repo.updateCounty).not.toHaveBeenCalled();
    expect(repo.deleteCounty).not.toHaveBeenCalled();
  });

  it("rejects a super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(addDefaultCounties(repo, auditWith(), superAdmin));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createCounty).not.toHaveBeenCalled();
  });

  it("uses the province of the calling admin, not another admin province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(farsAdminRecord) });
    await addDefaultCounties(repo, auditWith(), farsAdmin);

    expect(repo.findCountiesByProvince).toHaveBeenCalledWith("FARS");
    expect(repo.createCounty).toHaveBeenCalledWith({ province: "FARS", name: "آباده" });
    expect(repo.createCounty).not.toHaveBeenCalledWith(expect.objectContaining({ province: "TEHRAN" }));
  });
});
