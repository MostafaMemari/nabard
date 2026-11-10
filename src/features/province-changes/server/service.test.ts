import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import {
  ProvinceChangeGenderMismatchError,
  ProvinceChangeOwnerChangedError,
  type ProvinceChangeRepository,
  type ProvinceChangeRow,
  type UserIdentityRecord,
} from "./repository";
import {
  approveProvinceChangeRequest,
  createProvinceChangeRequest,
  decideProvinceChangeRequest,
  listProvinceChangeRequests,
  rejectProvinceChangeRequest,
} from "./service";

const coach: CurrentUser = { id: "coach-1", role: "COACH" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };

const coachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", province: "TEHRAN", isActive: true };
const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "FARS", isActive: true };
const superAdminRecord: UserIdentityRecord = { ...adminRecord, id: "super-1", province: null };

const createdAt = new Date("2026-11-13T09:00:00.000Z");

function row(overrides: Partial<ProvinceChangeRow> = {}): ProvinceChangeRow {
  return {
    id: "request-1",
    studentId: "student-1",
    studentName: "علی رضایی",
    fromCoachId: "coach-1",
    fromCoachName: "سعید احمدی",
    fromProvince: "TEHRAN",
    toProvince: "FARS",
    toCoachId: "coach-9",
    toCoachName: "مریم نوری",
    status: "PENDING",
    note: null,
    decidedAt: null,
    createdAt,
    ...overrides,
  };
}

const audit: AuditRepository = { createAuditLog: vi.fn().mockResolvedValue(undefined) };

function auditCalls(): AuditEntry[] {
  return vi.mocked(audit.createAuditLog).mock.calls.map((call) => call[0]);
}

const ownStudent = {
  id: "student-1",
  fullName: "علی رضایی",
  gender: "MALE" as const,
  coachId: "coach-1",
  coachName: "سعید احمدی",
  coachProvince: "TEHRAN" as const,
};

const farsCoachTarget = { id: "coach-9", fullName: "مریم نوری", province: "FARS" as const, isActive: true, gender: "MALE" as const };

function repoWith(overrides: Partial<ProvinceChangeRepository> = {}): ProvinceChangeRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    findStudentForMove: vi.fn().mockResolvedValue(ownStudent),
    findCoachTargetById: vi.fn().mockResolvedValue(farsCoachTarget),
    hasPendingMoveRequest: vi.fn().mockResolvedValue(false),
    createProvinceChange: vi.fn().mockResolvedValue(row()),
    countProvinceChanges: vi.fn().mockResolvedValue(1),
    findProvinceChanges: vi.fn().mockResolvedValue([row()]),
    findProvinceChangeById: vi.fn().mockResolvedValue(row()),
    decideProvinceChangeFromPending: vi.fn().mockResolvedValue(row({ status: "APPROVED" })),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("createProvinceChangeRequest", () => {
  const input = { toProvince: "FARS" as const, toCoachId: "coach-9" };

  it("creates a pending request snapshotting both provinces", async () => {
    const repo = repoWith();

    const created = await createProvinceChangeRequest(repo, audit, coach, "student-1", input);

    expect(created).toMatchObject({ status: "PENDING", fromProvince: "TEHRAN", toProvince: "FARS", toCoachId: "coach-9" });
    expect(repo.createProvinceChange).toHaveBeenCalledWith({
      studentId: "student-1",
      fromCoachId: "coach-1",
      fromProvince: "TEHRAN",
      toProvince: "FARS",
      toCoachId: "coach-9",
    });
    expect(auditCalls().at(-1)).toMatchObject({ action: "province_change.requested" });
  });

  it("rejects a destination equal to the current province", async () => {
    const repo = repoWith();
    const failure = await failureOf(
      createProvinceChangeRequest(repo, audit, coach, "student-1", { toProvince: "TEHRAN", toCoachId: "coach-9" }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createProvinceChange).not.toHaveBeenCalled();
  });

  it("rejects a target coach outside the destination province", async () => {
    const repo = repoWith({ findCoachTargetById: vi.fn().mockResolvedValue({ ...farsCoachTarget, province: "TEHRAN" }) });
    const failure = await failureOf(createProvinceChangeRequest(repo, audit, coach, "student-1", input));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createProvinceChange).not.toHaveBeenCalled();
  });

  it("rejects an inactive target coach", async () => {
    const repo = repoWith({ findCoachTargetById: vi.fn().mockResolvedValue({ ...farsCoachTarget, isActive: false }) });
    const failure = await failureOf(createProvinceChangeRequest(repo, audit, coach, "student-1", input));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("rejects a gender mismatch with the target coach", async () => {
    const repo = repoWith({ findCoachTargetById: vi.fn().mockResolvedValue({ ...farsCoachTarget, gender: "FEMALE" }) });
    const failure = await failureOf(createProvinceChangeRequest(repo, audit, coach, "student-1", input));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("rejects when another move request is already pending", async () => {
    const repo = repoWith({ hasPendingMoveRequest: vi.fn().mockResolvedValue(true) });
    const failure = await failureOf(createProvinceChangeRequest(repo, audit, coach, "student-1", input));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createProvinceChange).not.toHaveBeenCalled();
  });

  it("rejects a coach who does not own the student with 404", async () => {
    const repo = repoWith({ findStudentForMove: vi.fn().mockResolvedValue({ ...ownStudent, coachId: "coach-5" }) });
    const failure = await failureOf(createProvinceChangeRequest(repo, audit, coach, "student-1", input));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("listProvinceChangeRequests", () => {
  it("scopes admin rows to requests arriving INTO the admin province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });

    await listProvinceChangeRequests(repo, admin, {});

    expect(repo.countProvinceChanges).toHaveBeenCalledWith({ status: undefined, toProvince: "FARS" });
  });

  it("scopes coach rows to their own outgoing requests", async () => {
    const repo = repoWith();

    await listProvinceChangeRequests(repo, coach, {});

    expect(repo.countProvinceChanges).toHaveBeenCalledWith({ status: undefined, fromCoachId: "coach-1" });
  });

  it("rejects the super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(listProvinceChangeRequests(repo, superAdmin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("decideProvinceChangeRequest", () => {
  it("approves as the destination province admin", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });

    const updated = await approveProvinceChangeRequest(repo, audit, admin, "request-1");

    expect(updated).toMatchObject({ status: "APPROVED" });
    expect(repo.decideProvinceChangeFromPending).toHaveBeenCalledWith("request-1", {
      status: "APPROVED",
      note: null,
      decidedById: "admin-1",
    });
    expect(auditCalls().at(-1)).toMatchObject({ action: "province_change.approved" });
  });

  it("rejects with the admin note", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideProvinceChangeFromPending: vi.fn().mockResolvedValue(row({ status: "REJECTED", note: "مربی مقصد تایید نمی شود" })),
    });

    const updated = await rejectProvinceChangeRequest(repo, audit, admin, "request-1", { note: "مربی مقصد تایید نمی شود" });

    expect(updated).toMatchObject({ status: "REJECTED" });
    expect(auditCalls().at(-1)).toMatchObject({ action: "province_change.rejected" });
  });

  it("hides requests whose destination is another province", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findProvinceChangeById: vi.fn().mockResolvedValue(row({ toProvince: "TEHRAN" })),
    });
    const failure = await failureOf(approveProvinceChangeRequest(repo, audit, admin, "request-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a non-admin with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(approveProvinceChangeRequest(repo, audit, coach, "request-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("fails with 409 when the request was already decided", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideProvinceChangeFromPending: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(approveProvinceChangeRequest(repo, audit, admin, "request-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("maps an owner change during approval to a 409 conflict", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideProvinceChangeFromPending: vi.fn().mockRejectedValue(new ProvinceChangeOwnerChangedError()),
    });
    const failure = await failureOf(approveProvinceChangeRequest(repo, audit, admin, "request-1"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409 });
  });

  it("maps a gender mismatch during approval to a 409 conflict", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideProvinceChangeFromPending: vi.fn().mockRejectedValue(new ProvinceChangeGenderMismatchError()),
    });
    const failure = await failureOf(approveProvinceChangeRequest(repo, audit, admin, "request-1"));

    expect(failure).toMatchObject({ status: 409 });
  });

  it("keeps decideProvinceChangeRequest export parity for approve and reject", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });

    await decideProvinceChangeRequest(repo, audit, admin, "request-1", "APPROVED", null);

    expect(repo.decideProvinceChangeFromPending).toHaveBeenCalledWith("request-1", {
      status: "APPROVED",
      note: null,
      decidedById: "admin-1",
    });
  });
});
