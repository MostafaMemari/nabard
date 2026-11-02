import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type { StudentDocumentRecord, StudentRecord, StudentRepository, StudentWithCoach, UserIdentityRecord } from "./repository";
import {
  approveStudentProfile,
  createStudent,
  deleteStudent,
  deleteStudentDocument,
  getStudent,
  listPendingReviewStudents,
  listStudents,
  readStudentDocument,
  rejectStudentProfile,
  updateStudent,
  uploadStudentDocument,
} from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", gender: null, province: "TEHRAN", isActive: true };
const coachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", gender: "MALE", province: "TEHRAN", isActive: true };
const inactiveCoachRecord: UserIdentityRecord = { ...coachRecord, isActive: false };

const createdAt = new Date("2026-08-01T09:15:00.000Z");

const documentRow: StudentDocumentRecord = {
  id: "doc-1",
  studentId: "student-1",
  type: "PHOTO",
  fileId: "file-1",
  createdAt,
};

const ownStudent: StudentWithCoach = {
  id: "student-1",
  fullName: "علی رضایی",
  gender: "MALE",
  nationalCode: "1234567890",
  birthDate: new Date("2013-05-10T00:00:00.000Z"),
  weightKg: 54.5,
  beltId: "belt-blue",
  coachId: "coach-1",
  coachName: "رضا کریمی",
  profileStatus: "APPROVED",
  profileNote: null,
  approvedAt: new Date("2026-08-02T10:00:00.000Z"),
  coachProvince: "TEHRAN",
  createdAt,
  updatedAt: createdAt,
};

const otherCoachStudent: StudentWithCoach = { ...ownStudent, id: "student-2", coachId: "coach-2" };
const farsStudent: StudentWithCoach = { ...ownStudent, id: "student-3", coachId: "coach-9", coachProvince: "FARS" };

function recordOf(student: StudentWithCoach): StudentRecord {
  const { coachProvince: _province, ...record } = student;
  return record;
}

function repoWith(overrides: Partial<StudentRepository> = {}): StudentRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    countStudents: vi.fn().mockResolvedValue(1),
    findStudents: vi.fn().mockResolvedValue([recordOf(ownStudent)]),
    findStudentById: vi.fn().mockResolvedValue(ownStudent),
    findStudentDocuments: vi.fn().mockResolvedValue([documentRow]),
    findNationalCodeOwner: vi.fn().mockResolvedValue(null),
    beltExists: vi.fn().mockResolvedValue(true),
    countRegistrations: vi.fn().mockResolvedValue(0),
    createStudent: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    updateStudent: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    deleteStudent: vi.fn().mockResolvedValue(undefined),
    countPendingReviewStudents: vi.fn().mockResolvedValue(1),
    findPendingReviewStudents: vi.fn().mockResolvedValue([]),
    updateProfileStatusFromPendingOrRejected: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    upsertStudentDocument: vi.fn().mockResolvedValue(documentRow),
    findStudentDocument: vi.fn().mockResolvedValue(documentRow),
    deleteStudentDocumentWithFile: vi.fn().mockResolvedValue(documentRow),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

const createInput = {
  fullName: "سینا مرادی",
  gender: "MALE" as const,
  nationalCode: "1234567890",
  birthDate: "2013-05-10T00:00:00.000Z",
  beltId: "belt-blue",
  weightKg: 54.5,
};

describe("listStudents", () => {
  it("forces a coach to its own students and ignores the coachId param", async () => {
    const repo = repoWith();
    const result = await listStudents(repo, coach, { coachId: "coach-2", page: 2, pageSize: 10 });

    expect(repo.findStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: undefined, beltId: undefined, search: undefined }, 10, 10);
    expect(repo.countStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: undefined, beltId: undefined, search: undefined });
    expect(result).toEqual({ data: [recordOf(ownStudent)], meta: { page: 2, pageSize: 10, total: 1 } });
  });

  it("passes search and belt filters to the repository", async () => {
    const repo = repoWith();
    await listStudents(repo, coach, { search: "  علی  ", beltId: "belt-blue", gender: "FEMALE" });

    expect(repo.findStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: "FEMALE", beltId: "belt-blue", search: "علی" }, 0, 100);
  });

  it("scopes an admin to its province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listStudents(repo, admin, {});

    expect(repo.findStudents).toHaveBeenCalledWith(
      { province: "TEHRAN", coachId: undefined, gender: undefined, beltId: undefined, search: undefined },
      0,
      100,
    );
  });

  it("lets an admin filter by coachId inside the province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listStudents(repo, admin, { coachId: "coach-2" });

    expect(repo.findStudents).toHaveBeenCalledWith(
      { province: "TEHRAN", coachId: "coach-2", gender: undefined, beltId: undefined, search: undefined },
      0,
      100,
    );
  });

  it("rejects an inactive user with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveCoachRecord) });
    const failure = await failureOf(listStudents(repo, coach, {}));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findStudents).not.toHaveBeenCalled();
  });

  it("rejects a missing user row with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(listStudents(repo, coach, {}));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});

describe("getStudent", () => {
  it("returns a student of the coach with documents and without the coach province", async () => {
    const repo = repoWith();
    const result = await getStudent(repo, coach, "student-1");

    expect(result).toEqual({ ...recordOf(ownStudent), coachName: "رضا کریمی", documents: [documentRow] });
    expect(result).not.toHaveProperty("coachProvince");
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(getStudent(repo, coach, "student-2"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns a student of the admin province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await getStudent(repo, admin, "student-1");

    expect(result.id).toBe("student-1");
  });

  it("hides a student of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue(farsStudent),
    });
    const failure = await failureOf(getStudent(repo, admin, "student-3"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a missing student with 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getStudent(repo, coach, "student-404"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("createStudent", () => {
  it("creates the student under the session coach", async () => {
    const repo = repoWith();
    await createStudent(repo, coach, createInput);

    expect(repo.createStudent).toHaveBeenCalledTimes(1);
    const data = vi.mocked(repo.createStudent).mock.calls[0][0];
    expect(data).toMatchObject({
      fullName: "سینا مرادی",
      gender: "MALE",
      nationalCode: "1234567890",
      beltId: "belt-blue",
      weightKg: 54.5,
      coachId: "coach-1",
    });
    expect(data.birthDate).toEqual(new Date("2013-05-10T00:00:00.000Z"));
  });

  it("stores a null weight when the weight is missing", async () => {
    const repo = repoWith();
    await createStudent(repo, coach, { ...createInput, weightKg: null });

    expect(vi.mocked(repo.createStudent).mock.calls[0][0].weightKg).toBeNull();
  });

  it("rejects a student whose gender differs from the coach gender with 400", async () => {
    const repo = repoWith();
    const failure = (await failureOf(createStudent(repo, coach, { ...createInput, gender: "FEMALE" as const }))) as { message: string };

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(failure?.message).toContain("جنسیت");
    expect(repo.createStudent).not.toHaveBeenCalled();
  });

  it("rejects an admin with 403 without touching the repository", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createStudent(repo, admin, createInput));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createStudent).not.toHaveBeenCalled();
  });

  it("rejects a duplicate national code with 409", async () => {
    const repo = repoWith({ findNationalCodeOwner: vi.fn().mockResolvedValue({ id: "student-9" }) });
    const failure = await failureOf(createStudent(repo, coach, createInput));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createStudent).not.toHaveBeenCalled();
  });

  it("rejects an unknown belt with 400", async () => {
    const repo = repoWith({ beltExists: vi.fn().mockResolvedValue(false) });
    const failure = await failureOf(createStudent(repo, coach, createInput));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createStudent).not.toHaveBeenCalled();
  });

  it("rejects an inactive coach with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveCoachRecord) });
    const failure = await failureOf(createStudent(repo, coach, createInput));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createStudent).not.toHaveBeenCalled();
  });
});

describe("updateStudent", () => {
  it("edits fields of an own student and resets an approved profile to pending on identity change", async () => {
    const repo = repoWith();
    await updateStudent(repo, coach, "student-1", { fullName: "نام تازه", weightKg: null });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", { fullName: "نام تازه", weightKg: null, profileStatus: "PENDING" });
  });

  it("converts the birth date to a Date and resets the approved profile", async () => {
    const repo = repoWith();
    await updateStudent(repo, coach, "student-1", { birthDate: "2010-01-15T00:00:00.000Z" });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", {
      birthDate: new Date("2010-01-15T00:00:00.000Z"),
      profileStatus: "PENDING",
    });
  });

  it("does not reset the profile when only the weight changes", async () => {
    const repo = repoWith();
    await updateStudent(repo, coach, "student-1", { weightKg: 61.5 });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", { weightKg: 61.5 });
  });

  it("does not reset the profile when identity fields are sent unchanged", async () => {
    const repo = repoWith();
    await updateStudent(repo, coach, "student-1", { fullName: ownStudent.fullName, beltId: ownStudent.beltId });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", { fullName: ownStudent.fullName, beltId: ownStudent.beltId });
  });

  it("keeps a pending profile pending when the coach edits identity fields", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue({ ...ownStudent, profileStatus: "PENDING" }) });
    await updateStudent(repo, coach, "student-1", { fullName: "نام تازه" });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", { fullName: "نام تازه" });
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(updateStudent(repo, coach, "student-2", { fullName: "نام تازه" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(updateStudent(repo, admin, "student-1", { fullName: "نام تازه" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });

  it("rejects a national code of another student with 409", async () => {
    const repo = repoWith({ findNationalCodeOwner: vi.fn().mockResolvedValue({ id: "student-9" }) });
    const failure = await failureOf(updateStudent(repo, coach, "student-1", { nationalCode: "1234567890" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });

  it("allows keeping the own national code", async () => {
    const repo = repoWith({ findNationalCodeOwner: vi.fn().mockResolvedValue({ id: "student-1" }) });
    await updateStudent(repo, coach, "student-1", { nationalCode: "1234567890" });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", { nationalCode: "1234567890" });
  });

  it("rejects an unknown belt with 400", async () => {
    const repo = repoWith({ beltExists: vi.fn().mockResolvedValue(false) });
    const failure = await failureOf(updateStudent(repo, coach, "student-1", { beltId: "belt-nope" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });
});

describe("deleteStudent", () => {
  it("deletes an own student without registrations", async () => {
    const repo = repoWith();
    const result = await deleteStudent(repo, coach, "student-1");

    expect(repo.deleteStudent).toHaveBeenCalledWith("student-1");
    expect(result).toEqual({ id: "student-1" });
  });

  it("blocks a student with registrations with 409", async () => {
    const repo = repoWith({ countRegistrations: vi.fn().mockResolvedValue(2) });
    const failure = await failureOf(deleteStudent(repo, coach, "student-1"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(deleteStudent(repo, coach, "student-2"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(deleteStudent(repo, admin, "student-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });
});

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 5, 6, 7]);

function documentFile(): File {
  return new File([JPEG_BYTES], "photo.jpg", { type: "image/jpeg" });
}

function storageWith(): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "file-9", mime: "image/jpeg", size: JPEG_BYTES.byteLength }),
    get: vi.fn().mockResolvedValue({ id: "file-1", mime: "image/jpeg", size: JPEG_BYTES.byteLength, data: JPEG_BYTES }),
  };
}

describe("uploadStudentDocument", () => {
  it("stores the image and upserts the document of the own student", async () => {
    const repo = repoWith();
    const storage = storageWith();
    const result = await uploadStudentDocument(repo, storage, coach, "student-1", "PHOTO", documentFile());

    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(repo.upsertStudentDocument).toHaveBeenCalledWith("student-1", "PHOTO", "file-9");
    expect(result).toEqual(documentRow);
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(uploadStudentDocument(repo, storageWith(), admin, "student-1", "PHOTO", documentFile()));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.upsertStudentDocument).not.toHaveBeenCalled();
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(uploadStudentDocument(repo, storageWith(), coach, "student-2", "PHOTO", documentFile()));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.upsertStudentDocument).not.toHaveBeenCalled();
  });

  it("rejects an unknown document type with 404", async () => {
    const repo = repoWith();
    const failure = await failureOf(uploadStudentDocument(repo, storageWith(), coach, "student-1", "PASSPORT", documentFile()));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.upsertStudentDocument).not.toHaveBeenCalled();
  });
});

describe("readStudentDocument", () => {
  it("returns the file of the owning coach", async () => {
    const repo = repoWith();
    const storage = storageWith();
    const result = await readStudentDocument(repo, storage, coach, "student-1", "PHOTO");

    expect(storage.get).toHaveBeenCalledWith("file-1");
    expect(result).toEqual({ data: JPEG_BYTES, mime: "image/jpeg" });
  });

  it("lets an admin of the same province read the document", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const storage = storageWith();
    await readStudentDocument(repo, storage, admin, "student-1", "NATIONAL_ID_OR_BIRTH_CERTIFICATE");

    expect(storage.get).toHaveBeenCalledWith("file-1");
  });

  it("hides documents outside the admin province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue(farsStudent),
    });
    const failure = await failureOf(readStudentDocument(repo, storageWith(), admin, "student-3", "PHOTO"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("answers 404 when the document is not uploaded yet", async () => {
    const repo = repoWith({ findStudentDocument: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(readStudentDocument(repo, storageWith(), coach, "student-1", "INSURANCE"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("deleteStudentDocument", () => {
  it("deletes the document of the owning coach", async () => {
    const repo = repoWith();
    const result = await deleteStudentDocument(repo, coach, "student-1", "BELT_CERTIFICATE");

    expect(repo.deleteStudentDocumentWithFile).toHaveBeenCalledWith("student-1", "BELT_CERTIFICATE");
    expect(result).toEqual({ type: "BELT_CERTIFICATE" });
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(deleteStudentDocument(repo, admin, "student-1", "PHOTO"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.deleteStudentDocumentWithFile).not.toHaveBeenCalled();
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(deleteStudentDocument(repo, coach, "student-2", "PHOTO"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("answers 404 when the document does not exist", async () => {
    const repo = repoWith({ deleteStudentDocumentWithFile: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(deleteStudentDocument(repo, coach, "student-1", "INSURANCE"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("listPendingReviewStudents", () => {
  it("scopes an admin to its province with the status filter and pagination", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await listPendingReviewStudents(repo, admin, { status: "REJECTED", page: 2, pageSize: 20 });

    expect(repo.findPendingReviewStudents).toHaveBeenCalledWith({ province: "TEHRAN", status: "REJECTED" }, 20, 20);
    expect(repo.countPendingReviewStudents).toHaveBeenCalledWith({ province: "TEHRAN", status: "REJECTED" });
    expect(result.meta).toEqual({ page: 2, pageSize: 20, total: 1 });
  });

  it("defaults to pending and rejected profiles", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listPendingReviewStudents(repo, admin, {});

    expect(repo.findPendingReviewStudents).toHaveBeenCalledWith({ province: "TEHRAN", status: undefined }, 0, 100);
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(listPendingReviewStudents(repo, coach, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findPendingReviewStudents).not.toHaveBeenCalled();
  });
});

describe("approveStudentProfile", () => {
  it("approves a pending profile of the province and clears the note", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue({ ...ownStudent, profileStatus: "PENDING" }),
    });
    await approveStudentProfile(repo, admin, "student-1");

    expect(repo.updateProfileStatusFromPendingOrRejected).toHaveBeenCalledWith("student-1", {
      status: "APPROVED",
      note: null,
      reviewedById: "admin-1",
    });
  });

  it("rejects an admin of another province with 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue(farsStudent),
    });
    const failure = await failureOf(approveStudentProfile(repo, admin, "student-3"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateProfileStatusFromPendingOrRejected).not.toHaveBeenCalled();
  });

  it("answers 409 when the profile was already reviewed", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      updateProfileStatusFromPendingOrRejected: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(approveStudentProfile(repo, admin, "student-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });
});

describe("rejectStudentProfile", () => {
  it("rejects a profile with the required note", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue({ ...ownStudent, profileStatus: "PENDING" }),
    });
    await rejectStudentProfile(repo, admin, "student-1", "عکس پرسنلی ناخوانا است.");

    expect(repo.updateProfileStatusFromPendingOrRejected).toHaveBeenCalledWith("student-1", {
      status: "REJECTED",
      note: "عکس پرسنلی ناخوانا است.",
      reviewedById: "admin-1",
    });
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(rejectStudentProfile(repo, coach, "student-1", "نامناسب"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateProfileStatusFromPendingOrRejected).not.toHaveBeenCalled();
  });
});
