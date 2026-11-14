import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type { StudentDocumentRecord, StudentRecord, StudentRepository, StudentWithCoach, UserIdentityRecord } from "./repository";
import {
  approveStudentProfile,
  createStudent,
  deleteStudent,
  getStudent,
  listPendingReviewStudents,
  listStudents,
  rejectStudentProfile,
  updateStudentBelt,
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
  mobile: "09123456789",
  insuranceDate: null,
  tkdBankChargeYear: null,
  beltCertificateDate: null,
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
    findExistingNationalCodes: vi.fn().mockResolvedValue(new Set<string>()),
    findActiveBelts: vi.fn().mockResolvedValue([{ id: "belt-blue", label: "آبی" }]),
    createStudents: vi.fn().mockResolvedValue(2),
    activeBeltExists: vi.fn().mockResolvedValue(true),
    beltExists: vi.fn().mockResolvedValue(true),
    countRegistrations: vi.fn().mockResolvedValue(0),
    countStudentTransfers: vi.fn().mockResolvedValue(0),
    createStudent: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    updateStudent: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    deleteStudent: vi.fn().mockResolvedValue(["file-1"]),
    countPendingReviewStudents: vi.fn().mockResolvedValue(1),
    findPendingReviewStudents: vi.fn().mockResolvedValue([]),
    updateProfileStatusFromPendingOrRejected: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    findStudentDocument: vi.fn().mockResolvedValue(documentRow),
    countStudentPhotoChangeRequests: vi.fn().mockResolvedValue(0),
    countStudentProvinceChangeRequests: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

const createInput = {
  fullName: "سینا مرادی",
  nationalCode: "1234567890",
  birthDate: "2013-05-10T00:00:00.000Z",
  mobile: "09123456789",
  beltId: "belt-blue",
  beltCertificateDate: "",
  insuranceDate: "",
  tkdBankChargeYear: "",
};

describe("photo urls", () => {
  it("attaches the public R2 photo url to list results and hides the file id", async () => {
    const repo = repoWith({
      findStudents: vi.fn().mockResolvedValue([{ ...recordOf(ownStudent), photoFileId: "file-1" }]),
    });
    const storage = storageWithUrls({ "file-1": "https://r2.example/student-photos/a?sig=1" });

    const result = await listStudents(repo, storage, coach, {});

    expect(result.data[0]).toMatchObject({ photoUrl: "https://r2.example/student-photos/a?sig=1" });
    expect(result.data[0]).not.toHaveProperty("photoFileId");
  });

  it("leaves the photo url null when the photo file is not on R2", async () => {
    const repo = repoWith({
      findStudents: vi.fn().mockResolvedValue([{ ...recordOf(ownStudent), photoFileId: "file-1" }]),
    });

    const result = await listStudents(repo, storageWith(), coach, {});

    expect(result.data[0]).toMatchObject({ photoUrl: null });
  });

  it("leaves students without a photo without a photo url", async () => {
    const repo = repoWith({
      findStudents: vi.fn().mockResolvedValue([recordOf(ownStudent)]),
    });

    const result = await listStudents(repo, storageWith(), coach, {});

    expect(result.data[0]).not.toHaveProperty("photoUrl");
  });

  it("attaches the public R2 photo url to the student detail", async () => {
    const repo = repoWith();
    const storage = storageWithUrls({ "file-1": "https://r2.example/student-photos/b?sig=2" });

    const result = await getStudent(repo, storage, coach, "student-1");

    expect(result.photoUrl).toBe("https://r2.example/student-photos/b?sig=2");
    expect(result.documents[0]).toMatchObject({ id: "doc-1", url: "https://r2.example/student-photos/b?sig=2" });
  });

  it("attaches the public R2 photo url to pending review results", async () => {
    const pending = { ...recordOf(ownStudent), coachName: "رضا کریمی", documents: [documentRow], photoFileId: "file-1" };
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findPendingReviewStudents: vi.fn().mockResolvedValue([pending]),
    });
    const storage = storageWithUrls({ "file-1": "https://r2.example/student-photos/c?sig=3" });

    const result = await listPendingReviewStudents(repo, storage, admin, {});

    expect(result.data[0]).toMatchObject({ photoUrl: "https://r2.example/student-photos/c?sig=3" });
    expect(result.data[0]).not.toHaveProperty("photoFileId");
    expect(result.data[0].documents[0]).toMatchObject({ id: "doc-1", url: "https://r2.example/student-photos/c?sig=3" });
  });
});

describe("listStudents", () => {
  it("forces a coach to its own students and ignores the coachId param", async () => {
    const repo = repoWith();
    const result = await listStudents(repo, storageWith(), coach, { coachId: "coach-2", page: 2, pageSize: 10 });

    expect(repo.findStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: undefined, beltId: undefined, search: undefined }, 10, 10);
    expect(repo.countStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: undefined, beltId: undefined, search: undefined });
    expect(result).toEqual({ data: [recordOf(ownStudent)], meta: { page: 2, pageSize: 10, total: 1 } });
  });

  it("passes search and belt filters to the repository", async () => {
    const repo = repoWith();
    await listStudents(repo, storageWith(), coach, { search: "  علی  ", beltId: "belt-blue", gender: "FEMALE" });

    expect(repo.findStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: "FEMALE", beltId: "belt-blue", search: "علی" }, 0, 100);
  });

  it("scopes an admin to its province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listStudents(repo, storageWith(), admin, {});

    expect(repo.findStudents).toHaveBeenCalledWith(
      { province: "TEHRAN", coachId: undefined, gender: undefined, beltId: undefined, search: undefined },
      0,
      100,
    );
  });

  it("lets an admin filter by coachId inside the province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listStudents(repo, storageWith(), admin, { coachId: "coach-2" });

    expect(repo.findStudents).toHaveBeenCalledWith(
      { province: "TEHRAN", coachId: "coach-2", gender: undefined, beltId: undefined, search: undefined },
      0,
      100,
    );
  });

  it("rejects an inactive user with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveCoachRecord) });
    const failure = await failureOf(listStudents(repo, storageWith(), coach, {}));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findStudents).not.toHaveBeenCalled();
  });

  it("rejects a missing user row with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(listStudents(repo, storageWith(), coach, {}));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});

describe("getStudent", () => {
  it("returns a student of the coach with documents and without the coach province", async () => {
    const repo = repoWith();
    const result = await getStudent(repo, storageWith(), coach, "student-1");

    expect(result).toEqual({
      ...recordOf(ownStudent),
      coachName: "رضا کریمی",
      documents: [{ ...documentRow, url: null }],
      photoUrl: null,
    });
    expect(result).not.toHaveProperty("coachProvince");
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(getStudent(repo, storageWith(), coach, "student-2"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns a student of the admin province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await getStudent(repo, storageWith(), admin, "student-1");

    expect(result.id).toBe("student-1");
  });

  it("hides a student of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue(farsStudent),
    });
    const failure = await failureOf(getStudent(repo, storageWith(), admin, "student-3"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a missing student with 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getStudent(repo, storageWith(), coach, "student-404"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("createStudent", () => {
  it("creates the student under the session coach with the coach gender and the chosen belt", async () => {
    const repo = repoWith();
    await createStudent(repo, coach, createInput);

    expect(repo.activeBeltExists).toHaveBeenCalledWith("belt-blue");
    expect(repo.createStudent).toHaveBeenCalledTimes(1);
    const data = vi.mocked(repo.createStudent).mock.calls[0][0];
    expect(data).toMatchObject({
      fullName: "سینا مرادی",
      gender: "MALE",
      nationalCode: "1234567890",
      mobile: "09123456789",
      beltId: "belt-blue",
      coachId: "coach-1",
      beltCertificateDate: null,
      insuranceDate: null,
      tkdBankChargeYear: null,
    });
    expect(data.birthDate).toEqual(new Date("2013-05-10T00:00:00.000Z"));
  });

  it("stores the optional belt certificate date as a Date value", async () => {
    const repo = repoWith();
    await createStudent(repo, coach, { ...createInput, beltCertificateDate: "2026-05-01T00:00:00.000Z" });

    const data = vi.mocked(repo.createStudent).mock.calls[0][0];
    expect(data.beltCertificateDate).toEqual(new Date("2026-05-01T00:00:00.000Z"));
  });

  it("rejects an inactive belt with 400", async () => {
    const repo = repoWith({ activeBeltExists: vi.fn().mockResolvedValue(false) });
    const failure = await failureOf(createStudent(repo, coach, createInput));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createStudent).not.toHaveBeenCalled();
  });

  it("stores the optional dates as Date values", async () => {
    const repo = repoWith();
    await createStudent(repo, coach, {
      ...createInput,
      insuranceDate: "2026-07-01T00:00:00.000Z",
      tkdBankChargeYear: "1400",
    });

    const data = vi.mocked(repo.createStudent).mock.calls[0][0];
    expect(data.insuranceDate).toEqual(new Date("2026-07-01T00:00:00.000Z"));
    expect(data.tkdBankChargeYear).toBe(1400);
  });

  it("rejects a coach whose own gender is missing with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...coachRecord, gender: null }) });
    const failure = (await failureOf(createStudent(repo, coach, createInput))) as { message: string };

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(failure?.message).toContain("جنسیت شما ثبت نشده است");
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

  it("rejects an inactive coach with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveCoachRecord) });
    const failure = await failureOf(createStudent(repo, coach, createInput));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createStudent).not.toHaveBeenCalled();
  });
});

describe("updateStudentBelt", () => {
  it("moves a province student to the given belt as the admin", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await updateStudentBelt(repo, admin, "student-1", { beltId: "belt-green" });

    expect(repo.updateStudent).toHaveBeenCalledWith("student-1", { beltId: "belt-green" });
  });

  it("hides a student of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findStudentById: vi.fn().mockResolvedValue(farsStudent),
    });
    const failure = await failureOf(updateStudentBelt(repo, admin, "student-3", { beltId: "belt-green" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateStudentBelt(repo, coach, "student-1", { beltId: "belt-green" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });

  it("rejects an unknown belt with 400", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      beltExists: vi.fn().mockResolvedValue(false),
    });
    const failure = await failureOf(updateStudentBelt(repo, admin, "student-1", { beltId: "belt-nope" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.updateStudent).not.toHaveBeenCalled();
  });
});

describe("deleteStudent", () => {
  it("deletes an own student without registrations or transfer history", async () => {
    const repo = repoWith();
    const result = await deleteStudent(repo, storageWith(), coach, "student-1");

    expect(repo.countRegistrations).toHaveBeenCalledWith("student-1");
    expect(repo.countStudentTransfers).toHaveBeenCalledWith("student-1");
    expect(repo.deleteStudent).toHaveBeenCalledWith("student-1");
    expect(result).toEqual({ id: "student-1" });
  });

  it("blocks a student with registrations with 409", async () => {
    const repo = repoWith({ countRegistrations: vi.fn().mockResolvedValue(2) });
    const failure = await failureOf(deleteStudent(repo, storageWith(), coach, "student-1"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });

  it("blocks a student with transfer request history (even rejected) with 409", async () => {
    const repo = repoWith({ countStudentTransfers: vi.fn().mockResolvedValue(1) });
    const failure = await failureOf(deleteStudent(repo, storageWith(), coach, "student-1"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(deleteStudent(repo, storageWith(), coach, "student-2"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(deleteStudent(repo, storageWith(), admin, "student-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });
});

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 5, 6, 7]);

function _documentFile(): File {
  return new File([JPEG_BYTES], "photo.jpg", { type: "image/jpeg" });
}

function storageWith(): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "file-9", mime: "image/jpeg", size: JPEG_BYTES.byteLength }),
    get: vi.fn().mockResolvedValue({ mime: "image/jpeg", size: JPEG_BYTES.byteLength, stream: new Blob([JPEG_BYTES]).stream() }),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrls: vi.fn().mockResolvedValue(new Map()),
  };
}

function storageWithUrls(urls: Record<string, string>): Storage {
  return { ...storageWith(), getUrls: vi.fn().mockResolvedValue(new Map(Object.entries(urls))) };
}

describe("listPendingReviewStudents", () => {
  it("scopes an admin to its province with the status filter and pagination", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await listPendingReviewStudents(repo, storageWith(), admin, { status: "REJECTED", page: 2, pageSize: 20 });

    expect(repo.findPendingReviewStudents).toHaveBeenCalledWith({ province: "TEHRAN", status: "REJECTED" }, 20, 20);
    expect(repo.countPendingReviewStudents).toHaveBeenCalledWith({ province: "TEHRAN", status: "REJECTED" });
    expect(result.meta).toEqual({ page: 2, pageSize: 20, total: 1 });
  });

  it("defaults to pending and rejected profiles", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listPendingReviewStudents(repo, storageWith(), admin, {});

    expect(repo.findPendingReviewStudents).toHaveBeenCalledWith({ province: "TEHRAN", status: undefined }, 0, 100);
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(listPendingReviewStudents(repo, storageWith(), coach, {}));

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
    await rejectStudentProfile(repo, admin, "student-1", "عکس پرسنلی ناخوانا است");

    expect(repo.updateProfileStatusFromPendingOrRejected).toHaveBeenCalledWith("student-1", {
      status: "REJECTED",
      note: "عکس پرسنلی ناخوانا است",
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
