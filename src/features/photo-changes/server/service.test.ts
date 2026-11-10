import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type { PhotoChangeRepository, PhotoChangeRow, UserIdentityRecord } from "./repository";
import {
  approvePhotoChangeRequest,
  createPhotoChangeRequest,
  listPhotoChangeRequests,
  readPhotoChangeFile,
  rejectPhotoChangeRequest,
} from "./service";

const coach: CurrentUser = { id: "coach-1", role: "COACH" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };

const coachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", province: "TEHRAN", isActive: true };
const otherCoachRecord: UserIdentityRecord = { ...coachRecord, id: "coach-2" };
const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true };
const farsAdminRecord: UserIdentityRecord = { ...adminRecord, id: "admin-2", province: "FARS" };
const superAdminRecord: UserIdentityRecord = { ...adminRecord, id: "super-1", province: null };

const createdAt = new Date("2026-11-13T09:00:00.000Z");

function row(overrides: Partial<PhotoChangeRow> = {}): PhotoChangeRow {
  return {
    id: "request-1",
    studentId: "student-1",
    studentName: "علی رضایی",
    coachId: "coach-1",
    coachName: "سعید احمدی",
    coachProvince: "TEHRAN",
    hasCurrentPhoto: true,
    newFileId: "new-file-1",
    status: "PENDING",
    note: null,
    decidedAt: null,
    createdAt,
    ...overrides,
  };
}

function storageWith(): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "new-file-1", mime: "image/jpeg", size: 1000 }),
    get: vi.fn().mockResolvedValue({ mime: "image/jpeg", size: 1000, stream: new ReadableStream<Uint8Array>() }),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrls: vi.fn().mockResolvedValue(new Map()),
  };
}

const audit: AuditRepository = { createAuditLog: vi.fn().mockResolvedValue(undefined) };

function auditCalls(): AuditEntry[] {
  return vi.mocked(audit.createAuditLog).mock.calls.map((call) => call[0]);
}

function imageFile(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], "photo.jpg", { type: "image/jpeg" });
}

function repoWith(overrides: Partial<PhotoChangeRepository> = {}): PhotoChangeRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    findStudentById: vi.fn().mockResolvedValue({ id: "student-1", fullName: "علی رضایی", coachId: "coach-1", coachProvince: "TEHRAN" }),
    findPendingPhotoChangeByStudentId: vi.fn().mockResolvedValue(null),
    createPhotoChange: vi.fn().mockResolvedValue(row()),
    countPhotoChanges: vi.fn().mockResolvedValue(1),
    findPhotoChanges: vi.fn().mockResolvedValue([row()]),
    findPhotoChangeById: vi.fn().mockResolvedValue(row()),
    decidePhotoChangeFromPending: vi.fn().mockResolvedValue({ row: row({ status: "APPROVED" }), replacedFileId: "old-file-1" }),
    findPhotoChangeFileId: vi.fn().mockResolvedValue({ fileId: "new-file-1", studentCoachId: "coach-1", studentCoachProvince: "TEHRAN" }),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("createPhotoChangeRequest", () => {
  it("stores the uploaded photo and creates a pending request for the own student", async () => {
    const repo = repoWith();
    const storage = storageWith();

    const created = await createPhotoChangeRequest(repo, storage, audit, coach, "student-1", imageFile());

    expect(created).toMatchObject({ status: "PENDING", studentId: "student-1" });
    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(repo.createPhotoChange).toHaveBeenCalledWith({ studentId: "student-1", newFileId: "new-file-1" });
    expect(auditCalls().at(-1)).toMatchObject({ action: "photo_change.requested" });
  });

  it("rejects another coach's student with 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(otherCoachRecord),
      findStudentById: vi.fn().mockResolvedValue({ id: "student-1", fullName: "علی رضایی", coachId: "coach-1", coachProvince: "TEHRAN" }),
    });
    const failure = await failureOf(
      createPhotoChangeRequest(repo, storageWith(), audit, { id: "coach-2", role: "COACH" }, "student-1", imageFile()),
    );

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.createPhotoChange).not.toHaveBeenCalled();
  });

  it("rejects a second pending request for the same student with 409", async () => {
    const repo = repoWith({ findPendingPhotoChangeByStudentId: vi.fn().mockResolvedValue(row()) });
    const storage = storageWith();
    const failure = await failureOf(createPhotoChangeRequest(repo, storage, audit, coach, "student-1", imageFile()));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createPhotoChange).not.toHaveBeenCalled();
  });

  it("removes the stored photo when the row creation fails", async () => {
    const repo = repoWith({ createPhotoChange: vi.fn().mockRejectedValue(new Error("db down")) });
    const storage = storageWith();
    const failure = await failureOf(createPhotoChangeRequest(repo, storage, audit, coach, "student-1", imageFile()));

    expect(failure).toBeInstanceOf(Error);
    expect(storage.delete).toHaveBeenCalledWith("new-file-1");
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createPhotoChangeRequest(repo, storageWith(), audit, admin, "student-1", imageFile()));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("listPhotoChangeRequests", () => {
  it("scopes admin rows to the province coaches", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });

    await listPhotoChangeRequests(repo, admin, {});

    expect(repo.countPhotoChanges).toHaveBeenCalledWith({ status: undefined, province: "TEHRAN" });
  });

  it("scopes coach rows to their own students", async () => {
    const repo = repoWith();

    await listPhotoChangeRequests(repo, coach, {});

    expect(repo.countPhotoChanges).toHaveBeenCalledWith({ status: undefined, coachId: "coach-1" });
  });

  it("rejects the super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const failure = await failureOf(listPhotoChangeRequests(repo, superAdmin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("readPhotoChangeFile", () => {
  it("streams the pending photo for the province admin", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const storage = storageWith();

    const file = await readPhotoChangeFile(repo, storage, admin, "request-1");

    expect(file.mime).toBe("image/jpeg");
    expect(storage.get).toHaveBeenCalledWith("new-file-1");
  });

  it("hides the photo from an admin of another province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(farsAdminRecord) });
    const failure = await failureOf(readPhotoChangeFile(repo, storageWith(), { id: "admin-2", role: "ADMIN" }, "request-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("answers 404 once the request photo was purged from storage", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findPhotoChangeFileId: vi.fn().mockResolvedValue({ fileId: null, studentCoachId: "coach-1", studentCoachProvince: "TEHRAN" }),
    });
    const storage = storageWith();

    const failure = await failureOf(readPhotoChangeFile(repo, storage, admin, "request-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(storage.get).not.toHaveBeenCalled();
  });
});

describe("approvePhotoChangeRequest", () => {
  it("replaces the PHOTO document and deletes the replaced file", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const storage = storageWith();

    const updated = await approvePhotoChangeRequest(repo, storage, audit, admin, "request-1");

    expect(updated).toMatchObject({ status: "APPROVED" });
    expect(storage.delete).toHaveBeenCalledWith("old-file-1");
    expect(auditCalls().at(-1)).toMatchObject({ action: "photo_change.approved" });
  });

  it("keeps no replaced file to delete when the student had no photo", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decidePhotoChangeFromPending: vi.fn().mockResolvedValue({ row: row({ status: "APPROVED" }), replacedFileId: null }),
    });
    const storage = storageWith();

    await approvePhotoChangeRequest(repo, storage, audit, admin, "request-1");

    expect(storage.delete).not.toHaveBeenCalled();
  });

  it("rejects a non-admin with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(approvePhotoChangeRequest(repo, storageWith(), audit, coach, "request-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("hides requests outside the admin province", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(farsAdminRecord),
      findPhotoChangeById: vi.fn().mockResolvedValue(row({ coachProvince: "TEHRAN" })),
    });
    const failure = await failureOf(approvePhotoChangeRequest(repo, storageWith(), audit, { id: "admin-2", role: "ADMIN" }, "request-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("fails with 409 when the request was already decided", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decidePhotoChangeFromPending: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(approvePhotoChangeRequest(repo, storageWith(), audit, admin, "request-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });
});

describe("rejectPhotoChangeRequest", () => {
  it("deletes the pending photo and keeps the request as history", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decidePhotoChangeFromPending: vi
        .fn()
        .mockResolvedValue({ row: row({ status: "REJECTED", note: "کیفیت پایین" }), replacedFileId: null }),
    });
    const storage = storageWith();

    const updated = await rejectPhotoChangeRequest(repo, storage, audit, admin, "request-1", { note: "کیفیت پایین" });

    expect(updated).toMatchObject({ status: "REJECTED" });
    expect(storage.delete).toHaveBeenCalledWith("new-file-1");
    expect(auditCalls().at(-1)).toMatchObject({ action: "photo_change.rejected" });
  });
});
