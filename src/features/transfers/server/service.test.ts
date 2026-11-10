import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import {
  StudentOwnerChangedError,
  TransferGenderMismatchError,
  type TransfersRepository,
  type TransferWithScope,
  type UserIdentityRecord,
} from "./repository";
import {
  createCoachChangeRequest,
  createTransferRequest,
  decideTransferRequest,
  listTransferRequests,
  lookupTransferStudent,
  maskStudentName,
  reassignCoachStudents,
} from "./service";

const coach: CurrentUser = { id: "coach-2", role: "COACH" };
const otherCoach: CurrentUser = { id: "coach-1", role: "COACH" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };

const coachRecord: UserIdentityRecord = {
  id: "coach-2",
  role: "COACH",
  province: "TEHRAN",
  isActive: true,
  countyId: "county-1",
  gender: "MALE",
};
const oldCoachRecord: UserIdentityRecord = { ...coachRecord, id: "coach-1", countyId: "county-2" };
const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true, countyId: null, gender: null };
const farsAdminRecord: UserIdentityRecord = { ...adminRecord, id: "admin-2", province: "FARS" };
const superAdminRecord: UserIdentityRecord = { ...adminRecord, id: "super-1", province: null };

const studentRow = {
  id: "student-1",
  fullName: "علی رضایی",
  gender: "MALE" as const,
  coachId: "coach-1",
  coachName: "سعید احمدی",
  coachProvince: "TEHRAN" as const,
};

function transferWith(overrides: Partial<TransferWithScope> = {}): TransferWithScope {
  return {
    id: "transfer-1",
    studentId: "student-1",
    studentName: "علی رضایی",
    fromCoachId: "coach-1",
    fromCoachName: "سعید احمدی",
    toCoachId: "coach-2",
    toCoachName: "رضا کریمی",
    status: "PENDING",
    note: null,
    decidedAt: null,
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    fromCoachProvince: "TEHRAN",
    toCoachProvince: "TEHRAN",
    ...overrides,
  };
}

function repoWith(overrides: Partial<TransfersRepository> = {}): TransfersRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    findStudentByNationalCode: vi.fn().mockResolvedValue(studentRow),
    findStudentById: vi.fn().mockResolvedValue(studentRow),
    hasPendingProvinceChange: vi.fn().mockResolvedValue(false),
    findPendingTransferByStudentId: vi.fn().mockResolvedValue(null),
    createTransfer: vi.fn().mockResolvedValue(transferWith()),
    countTransfers: vi.fn().mockResolvedValue(1),
    findTransfers: vi.fn().mockResolvedValue([transferWith()]),
    findCoachTransfers: vi.fn().mockResolvedValue([transferWith()]),
    findTransferById: vi.fn().mockResolvedValue(transferWith()),
    decideTransferFromPending: vi.fn().mockResolvedValue(transferWith({ status: "APPROVED" })),
    findCoachTargetById: vi.fn().mockImplementation(async (id: string) => {
      if (id === "coach-1") return { id: "coach-1", fullName: "سعید احمدی", province: "TEHRAN", isActive: false, gender: "MALE" };
      if (id === "coach-2") return { id: "coach-2", fullName: "رضا کریمی", province: "TEHRAN", isActive: true, gender: "MALE" };

      return null;
    }),
    countCoachStudents: vi.fn().mockResolvedValue(4),
    countCoachStudentsNotOfGender: vi.fn().mockResolvedValue(0),
    countCoachTransfers: vi.fn().mockResolvedValue(1),
    reassignCoachStudents: vi.fn().mockResolvedValue(4),
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

describe("maskStudentName", () => {
  it("keeps the first name and masks the family name", () => {
    expect(maskStudentName("علی رضایی")).toBe("علی ر…");
    expect(maskStudentName("محمد حسین مرادی")).toBe("محمد ح… م…");
    expect(maskStudentName("سارا")).toBe("سارا");
  });
});

describe("lookupTransferStudent", () => {
  it("returns only the masked name and the current coach name", async () => {
    const repo = repoWith();
    const result = await lookupTransferStudent(repo, coach, "0499370899");

    expect(repo.findStudentByNationalCode).toHaveBeenCalledWith("0499370899");
    expect(result).toEqual({ maskedName: "علی ر…", currentCoachName: "سعید احمدی" });
    expect(Object.keys(result).sort()).toEqual(["currentCoachName", "maskedName"]);
  });

  it("keeps an unknown national code behind 404", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(lookupTransferStudent(repo, coach, "0499370899"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a student of the requester with a Persian message", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue({ ...studentRow, coachId: "coach-2" }) });
    const failure = await failureOf(lookupTransferStudent(repo, coach, "0499370899"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("باشگاه شما");
  });

  it("blocks a student of another province with a clear Persian message", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue({ ...studentRow, coachProvince: "FARS" }) });
    const failure = await failureOf(lookupTransferStudent(repo, coach, "0499370899"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect((failure as AppError).message).toContain("بین استان ها");
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(lookupTransferStudent(repo, admin, "0499370899"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("blocks a student of the other gender with a Persian message", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue({ ...studentRow, gender: "FEMALE" as const }) });
    const failure = await failureOf(lookupTransferStudent(repo, coach, "0499370899"));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toContain("جنسیت هنرجو باید با جنسیت شما یکسان باشد");
  });

  it("blocks a coach without gender with a Persian message", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...coachRecord, gender: null }) });
    const failure = await failureOf(lookupTransferStudent(repo, coach, "0499370899"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect((failure as AppError).message).toContain("جنسیت شما ثبت نشده است");
  });
});

describe("createTransferRequest", () => {
  it("creates a PENDING request from the current coach to the requester and writes an audit entry", async () => {
    const repo = repoWith();
    const audit = auditWith();
    const result = await createTransferRequest(repo, audit, coach, { nationalCode: "0499370899" });

    expect(repo.createTransfer).toHaveBeenCalledWith({ studentId: "student-1", fromCoachId: "coach-1", toCoachId: "coach-2" });
    expect(result).toMatchObject({ id: "transfer-1", status: "PENDING", fromCoachName: "سعید احمدی", toCoachName: "رضا کریمی" });
    expect(audit.entries[0]).toMatchObject({
      actorId: "coach-2",
      action: "transfer.requested",
      entityType: "transfer",
      entityId: "transfer-1",
      details: { province: "TEHRAN" },
    });
  });

  it("blocks a second request while a PENDING one exists", async () => {
    const repo = repoWith({ findPendingTransferByStudentId: vi.fn().mockResolvedValue(transferWith()) });
    const failure = await failureOf(createTransferRequest(repo, auditWith(), coach, { nationalCode: "0499370899" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it("blocks a cross province request before creating it", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue({ ...studentRow, coachProvince: "FARS" }) });
    const failure = await failureOf(createTransferRequest(repo, auditWith(), coach, { nationalCode: "0499370899" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it("rejects a request for a student the requester already owns", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue({ ...studentRow, coachId: "coach-2" }) });
    const failure = await failureOf(createTransferRequest(repo, auditWith(), coach, { nationalCode: "0499370899" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it("blocks a request for a student of the other gender before creating it", async () => {
    const repo = repoWith({ findStudentByNationalCode: vi.fn().mockResolvedValue({ ...studentRow, gender: "FEMALE" as const }) });
    const failure = await failureOf(createTransferRequest(repo, auditWith(), coach, { nationalCode: "0499370899" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });
});

describe("createCoachChangeRequest", () => {
  const ownStudentRow = { ...studentRow, coachId: "coach-2" };
  const activeTarget = { id: "coach-3", fullName: "حسین موسوی", province: "TEHRAN" as const, isActive: true, gender: "MALE" as const };

  it("creates a PENDING owner initiated request and writes an audit entry", async () => {
    const repo = repoWith({
      findStudentById: vi.fn().mockResolvedValue(ownStudentRow),
      findCoachTargetById: vi.fn().mockResolvedValue(activeTarget),
    });
    const audit = auditWith();
    const result = await createCoachChangeRequest(repo, audit, coach, "student-1", { toCoachId: "coach-3" });

    expect(repo.createTransfer).toHaveBeenCalledWith({ studentId: "student-1", fromCoachId: "coach-2", toCoachId: "coach-3" });
    expect(result).toMatchObject({ id: "transfer-1", status: "PENDING" });
    expect(audit.entries[0]).toMatchObject({
      actorId: "coach-2",
      action: "transfer.requested",
      entityType: "transfer",
      details: { province: "TEHRAN", initiatedBy: "owner" },
    });
  });

  it("rejects a coach who does not own the student with 404", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCoachChangeRequest(repo, auditWith(), coach, "student-1", { toCoachId: "coach-3" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it("blocks a target coach outside the student province", async () => {
    const repo = repoWith({
      findStudentById: vi.fn().mockResolvedValue(ownStudentRow),
      findCoachTargetById: vi.fn().mockResolvedValue({ ...activeTarget, province: "FARS" as const }),
    });
    const failure = await failureOf(createCoachChangeRequest(repo, auditWith(), coach, "student-1", { toCoachId: "coach-3" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });

  it("blocks an inactive or gender mismatched target coach", async () => {
    const inactiveRepo = repoWith({
      findStudentById: vi.fn().mockResolvedValue(ownStudentRow),
      findCoachTargetById: vi.fn().mockResolvedValue({ ...activeTarget, isActive: false }),
    });
    const inactiveFailure = await failureOf(
      createCoachChangeRequest(inactiveRepo, auditWith(), coach, "student-1", { toCoachId: "coach-3" }),
    );

    expect(inactiveFailure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    const genderRepo = repoWith({
      findStudentById: vi.fn().mockResolvedValue(ownStudentRow),
      findCoachTargetById: vi.fn().mockResolvedValue({ ...activeTarget, gender: "FEMALE" as const }),
    });
    const genderFailure = await failureOf(createCoachChangeRequest(genderRepo, auditWith(), coach, "student-1", { toCoachId: "coach-3" }));

    expect(genderFailure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("blocks a second pending request of any move type", async () => {
    const repo = repoWith({
      findStudentById: vi.fn().mockResolvedValue(ownStudentRow),
      findCoachTargetById: vi.fn().mockResolvedValue(activeTarget),
      findPendingTransferByStudentId: vi.fn().mockResolvedValue(transferWith()),
    });
    const failure = await failureOf(createCoachChangeRequest(repo, auditWith(), coach, "student-1", { toCoachId: "coach-3" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });

    const provinceRepo = repoWith({
      findStudentById: vi.fn().mockResolvedValue(ownStudentRow),
      findCoachTargetById: vi.fn().mockResolvedValue(activeTarget),
      hasPendingProvinceChange: vi.fn().mockResolvedValue(true),
    });
    const provinceFailure = await failureOf(
      createCoachChangeRequest(provinceRepo, auditWith(), coach, "student-1", { toCoachId: "coach-3" }),
    );

    expect(provinceFailure).toMatchObject({ status: 409, code: "CONFLICT" });
  });
});

describe("listTransferRequests", () => {
  it("scopes an admin to the province of the previous coach", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listTransferRequests(repo, admin, { status: "PENDING", page: 2, pageSize: 20 });

    expect(repo.countTransfers).toHaveBeenCalledWith({ province: "TEHRAN", status: "PENDING" });
    expect(repo.findTransfers).toHaveBeenCalledWith({ province: "TEHRAN", status: "PENDING" }, 20, 20);
  });

  it("returns both directions for a coach with the old coach view restricted", async () => {
    const repo = repoWith();
    const result = await listTransferRequests(repo, coach, {});

    expect(repo.findCoachTransfers).toHaveBeenCalledWith("coach-2", {}, 0, 100);
    const incoming = result.data[0] as { direction: string; studentName: string | null };
    expect(incoming.direction).toBe("incoming");
    expect(incoming.studentName).toBe("علی رضایی");
  });

  it("shows the losing coach the student name, the status and the new coach name", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(oldCoachRecord),
      findCoachTransfers: vi.fn().mockResolvedValue([transferWith()]),
    });
    const result = await listTransferRequests(repo, otherCoach, {});

    const outgoing = result.data[0] as {
      direction: string;
      studentId: string | null;
      studentName: string | null;
      fromCoachName: string | null;
      toCoachName: string;
      createdAt: string | null;
    };
    expect(outgoing.direction).toBe("outgoing");
    expect(outgoing.studentId).toBe("student-1");
    expect(outgoing.studentName).toBe("علی رضایی");
    expect(outgoing.fromCoachName).toBeNull();
    expect(outgoing.toCoachName).toBe("رضا کریمی");
    expect(outgoing.createdAt).not.toBeNull();
  });

  it("rejects a super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(listTransferRequests(repo, superAdmin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("decideTransferRequest", () => {
  it("approves inside the transaction and writes an audit entry", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const audit = auditWith();
    const result = await decideTransferRequest(repo, audit, admin, "transfer-1", "APPROVED", null);

    expect(repo.decideTransferFromPending).toHaveBeenCalledWith("transfer-1", { status: "APPROVED", note: null, decidedById: "admin-1" });
    expect(result.status).toBe("APPROVED");
    expect(audit.entries[0]).toMatchObject({ action: "transfer.approved", entityId: "transfer-1", details: { province: "TEHRAN" } });
  });

  it("stores the note when rejecting", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideTransferFromPending: vi.fn().mockResolvedValue(transferWith({ status: "REJECTED", note: "مدرک لازم است" })),
    });
    const result = await decideTransferRequest(repo, auditWith(), admin, "transfer-1", "REJECTED", "مدرک لازم است");

    expect(repo.decideTransferFromPending).toHaveBeenCalledWith("transfer-1", {
      status: "REJECTED",
      note: "مدرک لازم است",
      decidedById: "admin-1",
    });
    expect(result.note).toBe("مدرک لازم است");
  });

  it("keeps another province request behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(farsAdminRecord),
      findTransferById: vi.fn().mockResolvedValue(transferWith({ fromCoachProvince: "TEHRAN" })),
    });
    const failure = await failureOf(
      decideTransferRequest(repo, auditWith(), { id: "admin-2", role: "ADMIN" }, "transfer-1", "APPROVED", null),
    );

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.decideTransferFromPending).not.toHaveBeenCalled();
  });

  it("rejects an already decided request with 409", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideTransferFromPending: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(decideTransferRequest(repo, auditWith(), admin, "transfer-1", "APPROVED", null));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلا بررسی شده");
  });

  it("translates a lost ownership race into a 409 with a Persian message", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideTransferFromPending: vi.fn().mockRejectedValue(new StudentOwnerChangedError()),
    });
    const failure = await failureOf(decideTransferRequest(repo, auditWith(), admin, "transfer-1", "APPROVED", null));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("مالکیت این هنرجو تغییر کرده");
  });

  it("translates a gender mismatch in the approval transaction into a 409 with a Persian message", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideTransferFromPending: vi.fn().mockRejectedValue(new TransferGenderMismatchError()),
    });
    const failure = await failureOf(decideTransferRequest(repo, auditWith(), admin, "transfer-1", "APPROVED", null));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("جنسیت هنرجو با جنسیت مربی مقصد یکسان نیست");
  });
});

describe("reassignCoachStudents", () => {
  it("moves all students to an active coach of the same province and writes an audit entry", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const audit = auditWith();
    const result = await reassignCoachStudents(repo, audit, admin, "coach-1", { toCoachId: "coach-2" });

    expect(repo.reassignCoachStudents).toHaveBeenCalledWith("coach-1", "coach-2");
    expect(result).toEqual({ moved: 4 });
    expect(audit.entries[0]).toMatchObject({
      action: "students.reassigned",
      entityType: "coach",
      entityId: "coach-1",
      details: { province: "TEHRAN", moved: 4 },
    });
  });

  it("rejects an inactive target coach with a Persian message", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCoachTargetById: vi
        .fn()
        .mockImplementation(async (id: string) => ({ id, fullName: "م", province: "TEHRAN", isActive: false, gender: "MALE" })),
    });
    const failure = await failureOf(reassignCoachStudents(repo, auditWith(), admin, "coach-1", { toCoachId: "coach-2" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.reassignCoachStudents).not.toHaveBeenCalled();
  });

  it("rejects a target coach of another province", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCoachTargetById: vi
        .fn()
        .mockImplementation(async (id: string) =>
          id === "coach-1"
            ? { id: "coach-1", fullName: "س", province: "TEHRAN", isActive: false, gender: "MALE" }
            : { id: "coach-2", fullName: "م", province: "FARS", isActive: true, gender: "MALE" },
        ),
    });
    const failure = await failureOf(reassignCoachStudents(repo, auditWith(), admin, "coach-1", { toCoachId: "coach-2" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.reassignCoachStudents).not.toHaveBeenCalled();
  });

  it("keeps another province source coach behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(farsAdminRecord),
      findCoachTargetById: vi.fn().mockResolvedValue({ id: "coach-1", fullName: "س", province: "TEHRAN", isActive: false, gender: "MALE" }),
    });
    const failure = await failureOf(
      reassignCoachStudents(repo, auditWith(), { id: "admin-2", role: "ADMIN" }, "coach-1", { toCoachId: "coach-2" }),
    );

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("blocks a target coach without gender when the source has students", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCoachTargetById: vi
        .fn()
        .mockImplementation(async (id: string) => ({ id, fullName: "م", province: "TEHRAN", isActive: true, gender: null })),
      countCoachStudentsNotOfGender: vi.fn().mockResolvedValue(4),
    });
    const failure = await failureOf(reassignCoachStudents(repo, auditWith(), admin, "coach-1", { toCoachId: "coach-2" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toContain("جنسیت مربی مقصد ثبت نشده است");
    expect(repo.countCoachStudentsNotOfGender).toHaveBeenCalledWith("coach-1", null);
    expect(repo.reassignCoachStudents).not.toHaveBeenCalled();
  });

  it("blocks a target coach when students of the other gender would move", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      countCoachStudentsNotOfGender: vi.fn().mockResolvedValue(2),
    });
    const failure = await failureOf(reassignCoachStudents(repo, auditWith(), admin, "coach-1", { toCoachId: "coach-2" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("۲ هنرجو");
    expect(repo.reassignCoachStudents).not.toHaveBeenCalled();
  });

  it("moves students only when every student matches the target gender", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await reassignCoachStudents(repo, auditWith(), admin, "coach-1", { toCoachId: "coach-2" });

    expect(repo.countCoachStudentsNotOfGender).toHaveBeenCalledWith("coach-1", "MALE");
    expect(repo.reassignCoachStudents).toHaveBeenCalledWith("coach-1", "coach-2");
  });
});
