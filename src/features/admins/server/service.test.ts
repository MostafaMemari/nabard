import { compareSync } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { AdminRecord, AdminsRepository, UserIdentityRecord } from "./repository";
import { createAdmin, getAdmin, listAdmins, resetAdminPassword, updateAdmin } from "./service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const superAdminRecord: UserIdentityRecord = { id: "super-1", role: "SUPER_ADMIN", province: null, isActive: true };
const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true };

const createdAt = new Date("2026-07-15T08:30:00.000Z");

const tehranAdmin: AdminRecord = {
  id: "admin-1",
  mobile: "09121110000",
  fullName: "مدیر تهران",
  role: "ADMIN",
  province: "TEHRAN",
  isActive: true,
  createdAt,
  updatedAt: createdAt,
};

function repoWith(overrides: Partial<AdminsRepository> = {}): AdminsRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(superAdminRecord),
    countAdmins: vi.fn().mockResolvedValue(1),
    findAdmins: vi.fn().mockResolvedValue([tehranAdmin]),
    findAdminById: vi.fn().mockResolvedValue(tehranAdmin),
    findMobileOwner: vi.fn().mockResolvedValue(null),
    createAdmin: vi.fn().mockResolvedValue(tehranAdmin),
    updateAdmin: vi.fn().mockResolvedValue(tehranAdmin),
    updateAdminPassword: vi.fn().mockResolvedValue(tehranAdmin),
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

describe("role checks", () => {
  it("rejects an ADMIN with 403 without touching the repository", async () => {
    const repo = repoWith();
    const failure = await failureOf(listAdmins(repo, admin, {}));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findAdmins).not.toHaveBeenCalled();
  });

  it("rejects a COACH with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(getAdmin(repo, coach, "admin-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("rejects when the session role no longer matches the database role", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(listAdmins(repo, superAdmin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("rejects an inactive super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...superAdminRecord, isActive: false }) });
    const failure = await failureOf(listAdmins(repo, superAdmin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("rejects when the super admin row is gone with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(listAdmins(repo, superAdmin, {}));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});

describe("listAdmins and getAdmin", () => {
  it("lists province admins with search and status filters", async () => {
    const repo = repoWith();
    const result = await listAdmins(repo, superAdmin, { search: "  تهران  ", status: "active", page: 2, pageSize: 10 });

    expect(repo.findAdmins).toHaveBeenCalledWith({ search: "تهران", isActive: true }, 10, 10);
    expect(result).toEqual({ data: [tehranAdmin], meta: { page: 2, pageSize: 10, total: 1 } });
  });

  it("returns a single province admin", async () => {
    const repo = repoWith();
    const result = await getAdmin(repo, superAdmin, "admin-1");

    expect(result).toEqual(tehranAdmin);
  });

  it("keeps non-admin users behind 404", async () => {
    const repo = repoWith({ findAdminById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getAdmin(repo, superAdmin, "coach-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("createAdmin", () => {
  const input = {
    fullName: "سارا احمدی",
    mobile: "09122220000",
    initialPassword: "Secret!1234",
    province: "FARS" as const,
  };

  it("creates an active province admin with a bcrypt hash and writes an audit entry", async () => {
    const repo = repoWith({ createAdmin: vi.fn().mockResolvedValue({ ...tehranAdmin, province: "FARS" }) });
    const audit = auditWith();
    const result = await createAdmin(repo, audit, superAdmin, input);

    expect(repo.createAdmin).toHaveBeenCalledTimes(1);
    const data = vi.mocked(repo.createAdmin).mock.calls[0][0];
    expect(data).toMatchObject({ mobile: "09122220000", fullName: "سارا احمدی", province: "FARS" });
    expect(compareSync("Secret!1234", data.passwordHash)).toBe(true);
    expect(JSON.stringify(result)).not.toContain("Secret!1234");

    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorId: "super-1",
      action: "admin.created",
      entityType: "admin",
      entityId: "admin-1",
      details: { province: "FARS" },
    });
  });

  it("rejects a duplicate mobile with 409", async () => {
    const repo = repoWith({ findMobileOwner: vi.fn().mockResolvedValue({ id: "other" }) });
    const audit = auditWith();
    const failure = await failureOf(createAdmin(repo, audit, superAdmin, input));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createAdmin).not.toHaveBeenCalled();
    expect(audit.entries).toHaveLength(0);
  });
});

describe("updateAdmin", () => {
  it("deactivates an admin and writes an audit entry", async () => {
    const repo = repoWith({ updateAdmin: vi.fn().mockResolvedValue({ ...tehranAdmin, isActive: false }) });
    const audit = auditWith();
    await updateAdmin(repo, audit, superAdmin, "admin-1", { isActive: false });

    expect(repo.updateAdmin).toHaveBeenCalledWith("admin-1", { isActive: false });
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({ action: "admin.deactivated", entityType: "admin", entityId: "admin-1" });
  });

  it("reactivates an admin and writes an audit entry", async () => {
    const repo = repoWith({ findAdminById: vi.fn().mockResolvedValue({ ...tehranAdmin, isActive: false }) });
    const audit = auditWith();
    await updateAdmin(repo, audit, superAdmin, "admin-1", { isActive: true });

    expect(audit.entries[0]).toMatchObject({ action: "admin.activated" });
  });

  it("edits fields without an audit entry when the active state does not change", async () => {
    const repo = repoWith();
    const audit = auditWith();
    await updateAdmin(repo, audit, superAdmin, "admin-1", { fullName: "نام تازه", province: "ISFAHAN" });

    expect(repo.updateAdmin).toHaveBeenCalledWith("admin-1", { fullName: "نام تازه", province: "ISFAHAN" });
    expect(audit.entries).toHaveLength(0);
  });

  it("keeps another province admin behind 404", async () => {
    const repo = repoWith({ findAdminById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(updateAdmin(repo, auditWith(), superAdmin, "admin-9", { isActive: false }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateAdmin).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN actor with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateAdmin(repo, auditWith(), admin, "admin-1", { isActive: false }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateAdmin).not.toHaveBeenCalled();
  });
});

describe("resetAdminPassword", () => {
  it("stores a bcrypt hash and writes an audit entry without the password", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await resetAdminPassword(repo, audit, superAdmin, "admin-1", { password: "FreshPass1234" });

    const [id, passwordHash] = vi.mocked(repo.updateAdminPassword).mock.calls[0];
    expect(id).toBe("admin-1");
    expect(compareSync("FreshPass1234", passwordHash)).toBe(true);
    expect(JSON.stringify(result)).not.toContain("FreshPass1234");

    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({ action: "admin.password_reset", entityType: "admin", entityId: "admin-1" });
    expect(JSON.stringify(audit.entries[0])).not.toContain("FreshPass1234");
  });

  it("rejects an ADMIN actor with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(resetAdminPassword(repo, auditWith(), admin, "admin-1", { password: "FreshPass1234" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateAdminPassword).not.toHaveBeenCalled();
  });
});
