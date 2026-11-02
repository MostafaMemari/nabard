import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import type { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { BeltRecord, WeightClassSetPlan } from "./admin-repository";
import { createAgeCategory, createBelt, deleteAgeCategory, deleteBelt, saveWeightClassSet, updateBelt } from "./admin-service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };

const superAdminRecord = { id: "super-1", role: "SUPER_ADMIN" as const, province: null, isActive: true };

const belt: BeltRecord = {
  id: "belt-green",
  code: "green",
  label: "سبز",
  level: 3,
  order: 3,
  rankType: "COLOR",
  color: "سبز",
  colorHex: "#16a34a",
  isActive: true,
};

function repoWith(overrides: Record<string, unknown> = {}) {
  return {
    findUserById: vi.fn().mockResolvedValue(superAdminRecord),
    listBelts: vi.fn().mockResolvedValue([belt]),
    findBeltById: vi.fn().mockResolvedValue(belt),
    findBeltByLabel: vi.fn().mockResolvedValue(null),
    findBeltByLevel: vi.fn().mockResolvedValue(null),
    findBeltByCode: vi.fn().mockResolvedValue(null),
    countStudentsByBelt: vi.fn().mockResolvedValue(0),
    countCompetitionsByBelt: vi.fn().mockResolvedValue(0),
    createBelt: vi.fn().mockResolvedValue(belt),
    updateBelt: vi.fn().mockImplementation(async (_id: string, data: Record<string, unknown>) => ({ ...belt, ...data })),
    deleteBelt: vi.fn().mockResolvedValue(undefined),
    listAgeCategories: vi.fn().mockResolvedValue([]),
    findAgeCategoryById: vi.fn().mockResolvedValue(null),
    findAgeCategoryByLabel: vi.fn().mockResolvedValue(null),
    findAgeCategoryByCode: vi.fn().mockResolvedValue(null),
    findOverlappingActiveCategory: vi.fn().mockResolvedValue(null),
    countCompetitionsByAgeCategory: vi.fn().mockResolvedValue(0),
    countRegistrationsByAgeCategory: vi.fn().mockResolvedValue(0),
    createAgeCategory: vi.fn().mockResolvedValue({
      id: "cat-1",
      code: "new",
      label: "تازه",
      startDate: new Date(),
      endDate: new Date(),
      birthYearStart: 1390,
      birthYearEnd: 1400,
      isActive: true,
    }),
    updateAgeCategory: vi.fn(),
    deleteAgeCategory: vi.fn().mockResolvedValue(undefined),
    findWeightClassSet: vi.fn().mockResolvedValue([]),
    findRegisteredWeightClassIds: vi.fn().mockResolvedValue([]),
    findSnapshotWeightClassIds: vi.fn().mockResolvedValue([]),
    saveWeightClassSet: vi.fn().mockResolvedValue(undefined),
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
  it("rejects an ADMIN on every write with 403", async () => {
    const repo = repoWith();

    const failures = await Promise.all([
      failureOf(createBelt(repo, auditWith(), admin, { label: "بنفش", level: 9, rankType: "COLOR", color: null, colorHex: null })),
      failureOf(deleteBelt(repo, auditWith(), admin, "belt-green")),
      failureOf(
        createAgeCategory(repo, auditWith(), admin, {
          label: "تازه",
          startDate: "2018-01-01T00:00:00.000Z",
          endDate: "2019-12-31T00:00:00.000Z",
        }),
      ),
      failureOf(deleteAgeCategory(repo, auditWith(), admin, "cat-1")),
      failureOf(
        saveWeightClassSet(repo, auditWith(), admin, {
          ageCategoryId: "cat-1",
          gender: "MALE",
          rows: [{ label: "-20", minWeightKg: 0, maxWeightKg: 20, excludeMin: false, excludeMax: true }],
        }),
      ),
    ]);

    for (const failure of failures) {
      expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    }
    expect(repo.createBelt).not.toHaveBeenCalled();
    expect(repo.deleteBelt).not.toHaveBeenCalled();
  });

  it("rejects an inactive super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...superAdminRecord, isActive: false }) });
    const failure = await failureOf(
      createBelt(repo, auditWith(), superAdmin, { label: "بنفش", level: 9, rankType: "COLOR", color: null, colorHex: null }),
    );

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("belts", () => {
  it("creates a belt with a generated code and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const created = await createBelt(repo, audit, superAdmin, {
      label: "بنفش",
      level: 9,
      rankType: "COLOR",
      color: null,
      colorHex: "#7c3aed",
    });

    expect(repo.createBelt).toHaveBeenCalledWith(
      expect.objectContaining({ label: "بنفش", level: 9, code: expect.stringMatching(/^belt_/) }),
    );
    expect(audit.entries[0]).toMatchObject({ action: "belt.created", entityType: "belt", actorId: "super-1" });
    expect(created.label).toBe("سبز");
  });

  it("rejects a duplicate label, level or code with 409", async () => {
    const repo = repoWith({ findBeltByLabel: vi.fn().mockResolvedValue(belt) });
    const failure = await failureOf(
      createBelt(repo, auditWith(), superAdmin, { label: "سبز", level: 9, rankType: "COLOR", color: null, colorHex: null }),
    );
    expect(failure).toMatchObject({ status: 409 });

    const repoByLevel = repoWith({ findBeltByLevel: vi.fn().mockResolvedValue(belt) });
    const failureByLevel = await failureOf(
      createBelt(repoByLevel, auditWith(), superAdmin, { label: "بنفش", level: 3, rankType: "COLOR", color: null, colorHex: null }),
    );
    expect(failureByLevel).toMatchObject({ status: 409 });

    const repoByCode = repoWith({ findBeltByCode: vi.fn().mockResolvedValue(belt) });
    const failureByCode = await failureOf(
      createBelt(repoByCode, auditWith(), superAdmin, {
        code: "green",
        label: "بنفش",
        level: 9,
        rankType: "COLOR",
        color: null,
        colorHex: null,
      }),
    );
    expect(failureByCode).toMatchObject({ status: 409 });
  });

  it("blocks deleting a belt that a student or competition uses and suggests archiving", async () => {
    const repo = repoWith({ countStudentsByBelt: vi.fn().mockResolvedValue(2) });
    const failure = await failureOf(deleteBelt(repo, auditWith(), superAdmin, "belt-green"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("بایگانی");
    expect(repo.deleteBelt).not.toHaveBeenCalled();

    const repoByCompetition = repoWith({ countCompetitionsByBelt: vi.fn().mockResolvedValue(1) });
    const failureByCompetition = await failureOf(deleteBelt(repoByCompetition, auditWith(), superAdmin, "belt-green"));
    expect(failureByCompetition).toMatchObject({ status: 409 });
  });

  it("deletes an unused belt and archives through the isActive flag", async () => {
    const repo = repoWith();
    const audit = auditWith();
    await deleteBelt(repo, audit, superAdmin, "belt-green");

    expect(repo.deleteBelt).toHaveBeenCalledWith("belt-green");
    expect(audit.entries[0]).toMatchObject({ action: "belt.deleted" });

    const archiveRepo = repoWith({ updateBelt: vi.fn().mockResolvedValue({ ...belt, isActive: false }) });
    const archiveAudit = auditWith();
    await updateBelt(archiveRepo, archiveAudit, superAdmin, "belt-green", { isActive: false });

    expect(archiveRepo.updateBelt).toHaveBeenCalledWith("belt-green", { isActive: false });
    expect(archiveAudit.entries[0]).toMatchObject({ action: "belt.archived" });
  });

  it("rejects a level change to an existing level with 409", async () => {
    const repo = repoWith({ findBeltByLevel: vi.fn().mockResolvedValue({ ...belt, id: "belt-blue" }) });
    const failure = await failureOf(updateBelt(repo, auditWith(), superAdmin, "belt-green", { level: 4 }));

    expect(failure).toMatchObject({ status: 409 });
    expect(repo.updateBelt).not.toHaveBeenCalled();
  });
});

describe("age categories", () => {
  const createInput = { label: "آزمایشی", startDate: "2018-01-01T00:00:00.000Z", endDate: "2019-12-31T00:00:00.000Z" };

  it("derives the Jalali birth years from the dates", async () => {
    const repo = repoWith();
    await createAgeCategory(repo, auditWith(), superAdmin, createInput);

    expect(repo.createAgeCategory).toHaveBeenCalledWith(expect.objectContaining({ birthYearStart: 1396, birthYearEnd: 1398 }));
  });

  it("rejects overlapping active categories with 409", async () => {
    const repo = repoWith({ findOverlappingActiveCategory: vi.fn().mockResolvedValue({ id: "youth", label: "نونهال" }) });
    const failure = await failureOf(createAgeCategory(repo, auditWith(), superAdmin, createInput));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).details).toMatchObject({ field: "endDate" });
    expect(repo.createAgeCategory).not.toHaveBeenCalled();
  });

  it("blocks deleting a category that a competition or registration uses", async () => {
    const category = { id: "cat-1", label: "آزمایشی" };
    const repo = repoWith({
      findAgeCategoryById: vi.fn().mockResolvedValue(category),
      countCompetitionsByAgeCategory: vi.fn().mockResolvedValue(1),
    });
    const failure = await failureOf(deleteAgeCategory(repo, auditWith(), superAdmin, "cat-1"));

    expect(failure).toMatchObject({ status: 409 });
    expect((failure as AppError).message).toContain("بایگانی");

    const repoByRegistration = repoWith({
      findAgeCategoryById: vi.fn().mockResolvedValue(category),
      countRegistrationsByAgeCategory: vi.fn().mockResolvedValue(3),
    });
    const failureByRegistration = await failureOf(deleteAgeCategory(repoByRegistration, auditWith(), superAdmin, "cat-1"));
    expect(failureByRegistration).toMatchObject({ status: 409 });
  });

  it("deletes an unused category with an audit entry", async () => {
    const repo = repoWith({ findAgeCategoryById: vi.fn().mockResolvedValue({ id: "cat-1", label: "آزمایشی" }) });
    const audit = auditWith();
    await deleteAgeCategory(repo, audit, superAdmin, "cat-1");

    expect(repo.deleteAgeCategory).toHaveBeenCalledWith("cat-1");
    expect(audit.entries[0]).toMatchObject({ action: "age_category.deleted" });
  });
});

describe("saveWeightClassSet reconcile", () => {
  const input = { ageCategoryId: "cat-1", gender: "MALE" as const };

  const existing = (rows: Array<Record<string, unknown>>) =>
    repoWith({
      findAgeCategoryById: vi.fn().mockResolvedValue({ id: "cat-1", label: "بزرگسال" }),
      findWeightClassSet: vi.fn().mockResolvedValue(rows),
    });

  it("creates new rows and orders them by min", async () => {
    const repo = existing([]);
    const result = await saveWeightClassSet(repo, auditWith(), superAdmin, {
      ...input,
      rows: [
        { label: "+54", minWeightKg: 54, maxWeightKg: null, excludeMin: false, excludeMax: true },
        { label: "-54", minWeightKg: 0, maxWeightKg: 54, excludeMin: false, excludeMax: true },
      ],
    });

    const plan = vi.mocked(repo.saveWeightClassSet).mock.calls[0][0] as WeightClassSetPlan;
    expect(plan.creates.map((row) => row.label)).toEqual(["-54", "+54"]);
    expect(plan.creates.map((row) => row.order)).toEqual([1, 2]);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.archiveIds).toEqual([]);
    expect(result).toMatchObject({ created: 2, updated: 0 });
  });

  it("deletes a removed row that nothing uses", async () => {
    const repo = existing([
      {
        id: "wc-1",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "-54",
        minWeightKg: 0,
        maxWeightKg: 54,
        order: 1,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
      {
        id: "wc-2",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "+54",
        minWeightKg: 54,
        maxWeightKg: null,
        order: 2,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
    ]);
    await saveWeightClassSet(repo, auditWith(), superAdmin, {
      ...input,
      rows: [{ id: "wc-1", label: "-54", minWeightKg: 0, maxWeightKg: 60, excludeMin: false, excludeMax: true }],
    });

    const plan = vi.mocked(repo.saveWeightClassSet).mock.calls[0][0] as WeightClassSetPlan;
    expect(plan.deleteIds).toEqual(["wc-2"]);
    expect(plan.archiveIds).toEqual([]);
    expect(plan.updates).toHaveLength(1);
  });

  it("archives a removed row that registrations still point at", async () => {
    const repo = existing([
      {
        id: "wc-1",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "-54",
        minWeightKg: 0,
        maxWeightKg: 54,
        order: 1,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
      {
        id: "wc-2",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "+54",
        minWeightKg: 54,
        maxWeightKg: null,
        order: 2,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
    ]);
    repo.findRegisteredWeightClassIds.mockResolvedValue(["wc-2"]);

    await saveWeightClassSet(repo, auditWith(), superAdmin, {
      ...input,
      rows: [{ id: "wc-1", label: "-54", minWeightKg: 0, maxWeightKg: 60, excludeMin: false, excludeMax: true }],
    });

    const plan = vi.mocked(repo.saveWeightClassSet).mock.calls[0][0] as WeightClassSetPlan;
    expect(plan.archiveIds).toEqual(["wc-2"]);
    expect(plan.deleteIds).toEqual([]);
  });

  it("archives a removed row that a published competition snapshot references", async () => {
    const repo = existing([
      {
        id: "wc-1",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "-54",
        minWeightKg: 0,
        maxWeightKg: 54,
        order: 1,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
      {
        id: "wc-2",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "+54",
        minWeightKg: 54,
        maxWeightKg: null,
        order: 2,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
    ]);
    repo.findSnapshotWeightClassIds.mockResolvedValue(["wc-2"]);

    await saveWeightClassSet(repo, auditWith(), superAdmin, {
      ...input,
      rows: [{ id: "wc-1", label: "-54", minWeightKg: 0, maxWeightKg: 60, excludeMin: false, excludeMax: true }],
    });

    const plan = vi.mocked(repo.saveWeightClassSet).mock.calls[0][0] as WeightClassSetPlan;
    expect(plan.archiveIds).toEqual(["wc-2"]);
    expect(plan.deleteIds).toEqual([]);
  });

  it("rejects an invalid set before touching the repository", async () => {
    const repo = existing([]);
    const failure = await failureOf(
      saveWeightClassSet(repo, auditWith(), superAdmin, {
        ...input,
        rows: [{ label: "-54", minWeightKg: 10, maxWeightKg: 54, excludeMin: false, excludeMax: true }],
      }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.saveWeightClassSet).not.toHaveBeenCalled();
  });

  it("rejects unknown or duplicated row ids with 400", async () => {
    const repo = existing([
      {
        id: "wc-1",
        ageCategoryId: "cat-1",
        gender: "MALE",
        label: "-54",
        minWeightKg: 0,
        maxWeightKg: 54,
        order: 1,
        excludeMin: false,
        excludeMax: true,
        isActive: true,
      },
    ]);

    const unknownId = await failureOf(
      saveWeightClassSet(repo, auditWith(), superAdmin, {
        ...input,
        rows: [{ id: "wc-x", label: "-54", minWeightKg: 0, maxWeightKg: 54, excludeMin: false, excludeMax: true }],
      }),
    );
    expect(unknownId).toMatchObject({ status: 400 });

    const duplicated = await failureOf(
      saveWeightClassSet(repo, auditWith(), superAdmin, {
        ...input,
        rows: [
          { id: "wc-1", label: "-54", minWeightKg: 0, maxWeightKg: 54, excludeMin: false, excludeMax: true },
          { id: "wc-1", label: "+54", minWeightKg: 54, maxWeightKg: null, excludeMin: false, excludeMax: true },
        ],
      }),
    );
    expect(duplicated).toMatchObject({ status: 400 });
  });

  it("writes an audit entry without personal data", async () => {
    const repo = existing([]);
    const audit = auditWith();
    await saveWeightClassSet(repo, audit, superAdmin, {
      ...input,
      rows: [{ label: "-54", minWeightKg: 0, maxWeightKg: 54, excludeMin: false, excludeMax: true }],
    });

    expect(audit.entries[0]).toMatchObject({ action: "weight_class_set.updated", entityType: "weight_class_set", entityId: "cat-1:MALE" });
    expect(JSON.stringify(audit.entries[0].details)).not.toMatch(/نام|کد ملی|mobile/);
  });
});
