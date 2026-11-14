import { describe, expect, it, vi } from "vitest";
import type { AuditRepository } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type {
  RegistrationRequestRecord,
  RegistrationRequestWithCoach,
  StudentDocumentRecord,
  StudentRecord,
  StudentRepository,
  StudentWithCoach,
  UserIdentityRecord,
} from "./repository";
import {
  approveRegistrationRequest,
  createRegistrationRequest,
  deleteStudent,
  getRegistrationRequest,
  getStudent,
  listRegistrationRequests,
  listStudents,
  rejectRegistrationRequest,
  updateRegistrationRequest,
  updateRegistrationRequestBelt,
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

function recordOf(student: StudentWithCoach): StudentRecord {
  const { coachProvince: _province, ...record } = student;
  return record;
}

function requestRecordOf(student: StudentWithCoach, overrides: Partial<RegistrationRequestRecord> = {}): RegistrationRequestRecord {
  return {
    id: "request-1",
    coachId: student.coachId,
    fullName: student.fullName,
    gender: student.gender,
    nationalCode: student.nationalCode,
    birthDate: student.birthDate,
    mobile: student.mobile,
    insuranceDate: student.insuranceDate,
    tkdBankChargeYear: student.tkdBankChargeYear,
    beltCertificateDate: student.beltCertificateDate,
    beltId: student.beltId,
    status: "PENDING",
    reviewNote: null,
    reviewedById: null,
    reviewedAt: null,
    studentId: null,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    ...overrides,
  };
}

const ownRequest = requestRecordOf(ownStudent);
const ownRequestWithCoach: RegistrationRequestWithCoach = { ...ownRequest, coachName: "رضا کریمی", coachProvince: "TEHRAN" };
const farsRequestWithCoach: RegistrationRequestWithCoach = { ...ownRequestWithCoach, id: "request-9", coachProvince: "FARS" };
const rejectedRequestWithCoach: RegistrationRequestWithCoach = {
  ...ownRequestWithCoach,
  status: "REJECTED",
  reviewNote: "عکس پرسنلی ناخوانا است",
};

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
    activeBeltExists: vi.fn().mockResolvedValue(true),
    beltExists: vi.fn().mockResolvedValue(true),
    countRegistrations: vi.fn().mockResolvedValue(0),
    countStudentTransfers: vi.fn().mockResolvedValue(0),
    updateStudent: vi.fn().mockResolvedValue(recordOf(ownStudent)),
    deleteStudent: vi.fn().mockResolvedValue(["file-1"]),
    findStudentDocument: vi.fn().mockResolvedValue(documentRow),
    countStudentPhotoChangeRequests: vi.fn().mockResolvedValue(0),
    countStudentProvinceChangeRequests: vi.fn().mockResolvedValue(0),
    countRegistrationRequests: vi.fn().mockResolvedValue(1),
    findRegistrationRequests: vi.fn().mockResolvedValue([ownRequestWithCoach]),
    findRegistrationRequestById: vi.fn().mockResolvedValue(ownRequestWithCoach),
    findPendingRequestByNationalCode: vi.fn().mockResolvedValue(null),
    findRequestNationalCodes: vi.fn().mockResolvedValue(new Set<string>()),
    createRegistrationRequests: vi.fn().mockResolvedValue(2),
    createRegistrationRequest: vi.fn().mockResolvedValue(ownRequest),
    updateRegistrationRequest: vi.fn().mockResolvedValue(ownRequest),
    updateRegistrationRequestBelt: vi.fn().mockResolvedValue(ownRequest),
    setRegistrationRequestPhoto: vi.fn().mockResolvedValue(null),
    decideRegistrationRequest: vi.fn().mockResolvedValue(ownRequest),
    ...overrides,
  } as StudentRepository;
}

function auditWith(): AuditRepository {
  return { createAuditLog: vi.fn().mockResolvedValue(undefined) };
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

function storageWith(): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "file-9", mime: "image/jpeg", size: 8 }),
    get: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrls: vi.fn().mockResolvedValue(new Map()),
  };
}

function storageWithUrls(urls: Record<string, string>): Storage {
  return { ...storageWith(), getUrls: vi.fn().mockResolvedValue(new Map(Object.entries(urls))) };
}

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

  it("attaches the public R2 photo url to registration request results", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationRequests: vi.fn().mockResolvedValue([{ ...ownRequestWithCoach, photoFileId: "file-1" }]),
    });
    const storage = storageWithUrls({ "file-1": "https://r2.example/student-photos/c?sig=3" });

    const result = await listRegistrationRequests(repo, storage, admin, {});

    expect(result.data[0]).toMatchObject({ photoUrl: "https://r2.example/student-photos/c?sig=3" });
    expect(result.data[0]).not.toHaveProperty("photoFileId");
  });
});

describe("listStudents", () => {
  it("forces a coach to its own students and ignores the coachId param", async () => {
    const repo = repoWith();
    const result = await listStudents(repo, storageWith(), coach, { coachId: "coach-2", page: 2, pageSize: 10 });

    expect(repo.findStudents).toHaveBeenCalledWith({ coachId: "coach-1", gender: undefined, beltId: undefined, search: undefined }, 10, 10);
    expect(result).toEqual({ data: [recordOf(ownStudent)], meta: { page: 2, pageSize: 10, total: 1 } });
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

  it("rejects an inactive user with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveCoachRecord) });
    const failure = await failureOf(listStudents(repo, storageWith(), coach, {}));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findStudents).not.toHaveBeenCalled();
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
});

describe("createRegistrationRequest", () => {
  it("creates the request under the session coach with the coach gender and the chosen belt", async () => {
    const repo = repoWith();
    await createRegistrationRequest(repo, auditWith(), coach, createInput);

    expect(repo.activeBeltExists).toHaveBeenCalledWith("belt-blue");
    expect(repo.createRegistrationRequest).toHaveBeenCalledTimes(1);
    const data = vi.mocked(repo.createRegistrationRequest).mock.calls[0][0];
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

  it("stores the optional dates and year", async () => {
    const repo = repoWith();
    await createRegistrationRequest(repo, auditWith(), coach, {
      ...createInput,
      insuranceDate: "2026-07-01T00:00:00.000Z",
      tkdBankChargeYear: "1400",
    });

    const data = vi.mocked(repo.createRegistrationRequest).mock.calls[0][0];
    expect(data.insuranceDate).toEqual(new Date("2026-07-01T00:00:00.000Z"));
    expect(data.tkdBankChargeYear).toBe(1400);
  });

  it("writes an audit log for the request", async () => {
    const audit = auditWith();
    await createRegistrationRequest(repoWith(), audit, coach, createInput);

    expect(audit.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "registration_request.requested", entityType: "registration_request", actorId: "coach-1" }),
    );
  });

  it("rejects a duplicate national code of an approved student with 409", async () => {
    const repo = repoWith({ findNationalCodeOwner: vi.fn().mockResolvedValue({ id: "student-9" }) });
    const failure = await failureOf(createRegistrationRequest(repo, auditWith(), coach, createInput));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createRegistrationRequest).not.toHaveBeenCalled();
  });

  it("rejects when a pending request for the same national code exists with 409", async () => {
    const repo = repoWith({ findPendingRequestByNationalCode: vi.fn().mockResolvedValue({ id: "request-5" }) });
    const failure = await failureOf(createRegistrationRequest(repo, auditWith(), coach, createInput));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createRegistrationRequest).not.toHaveBeenCalled();
  });

  it("rejects an inactive belt with 400", async () => {
    const repo = repoWith({ activeBeltExists: vi.fn().mockResolvedValue(false) });
    const failure = await failureOf(createRegistrationRequest(repo, auditWith(), coach, createInput));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createRegistrationRequest).not.toHaveBeenCalled();
  });

  it("rejects an admin with 403 without touching the repository", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createRegistrationRequest(repo, auditWith(), admin, createInput));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createRegistrationRequest).not.toHaveBeenCalled();
  });
});

describe("updateRegistrationRequest", () => {
  it("resubmits a rejected request as pending with cleared review data", async () => {
    const repo = repoWith({ findRegistrationRequestById: vi.fn().mockResolvedValue(rejectedRequestWithCoach) });
    await updateRegistrationRequest(repo, coach, "request-1", createInput);

    const data = vi.mocked(repo.updateRegistrationRequest).mock.calls[0][1];
    expect(data).toMatchObject({ fullName: "سینا مرادی", nationalCode: "1234567890", beltId: "belt-blue" });
  });

  it("re-checks the national code excluding the request itself", async () => {
    const repo = repoWith({ findRegistrationRequestById: vi.fn().mockResolvedValue(rejectedRequestWithCoach) });
    await updateRegistrationRequest(repo, coach, "request-1", createInput);

    expect(repo.findPendingRequestByNationalCode).toHaveBeenCalledWith("1234567890", "request-1");
    expect(repo.findNationalCodeOwner).toHaveBeenCalledWith("1234567890");
  });

  it("blocks the edit of an approved request with 409", async () => {
    const repo = repoWith({
      findRegistrationRequestById: vi.fn().mockResolvedValue({ ...ownRequestWithCoach, status: "APPROVED" }),
    });
    const failure = await failureOf(updateRegistrationRequest(repo, coach, "request-1", createInput));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateRegistrationRequest).not.toHaveBeenCalled();
  });

  it("hides another coach request behind 404", async () => {
    const repo = repoWith({
      findRegistrationRequestById: vi.fn().mockResolvedValue({ ...ownRequestWithCoach, coachId: "coach-2" }),
    });
    const failure = await failureOf(updateRegistrationRequest(repo, coach, "request-1", createInput));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateRegistrationRequest).not.toHaveBeenCalled();
  });
});

describe("listRegistrationRequests", () => {
  it("scopes a coach to its own requests with every status", async () => {
    const repo = repoWith();
    await listRegistrationRequests(repo, storageWith(), coach, {});

    expect(repo.findRegistrationRequests).toHaveBeenCalledWith({ coachId: "coach-1" }, 0, 100);
  });

  it("scopes an admin to its province and defaults to pending and rejected", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listRegistrationRequests(repo, storageWith(), admin, {});

    expect(repo.findRegistrationRequests).toHaveBeenCalledWith({ province: "TEHRAN", status: { in: ["PENDING", "REJECTED"] } }, 0, 100);
  });

  it("lets an admin filter by status with pagination", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listRegistrationRequests(repo, storageWith(), admin, { status: "REJECTED", page: 2, pageSize: 20 });

    expect(repo.findRegistrationRequests).toHaveBeenCalledWith({ province: "TEHRAN", status: "REJECTED" }, 20, 20);
    expect(repo.countRegistrationRequests).toHaveBeenCalledWith({ province: "TEHRAN", status: "REJECTED" });
  });
});

describe("getRegistrationRequest", () => {
  it("returns the coach request with the photo url", async () => {
    const repo = repoWith();
    const result = await getRegistrationRequest(repo, storageWith(), coach, "request-1");

    expect(result).toMatchObject({ id: "request-1", coachName: "رضا کریمی" });
    expect(result).not.toHaveProperty("coachProvince");
  });

  it("hides a request of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationRequestById: vi.fn().mockResolvedValue(farsRequestWithCoach),
    });
    const failure = await failureOf(getRegistrationRequest(repo, storageWith(), admin, "request-9"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("updateRegistrationRequestBelt", () => {
  it("moves a pending province request to the given belt as the admin", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await updateRegistrationRequestBelt(repo, admin, "request-1", { beltId: "belt-green" });

    expect(repo.updateRegistrationRequestBelt).toHaveBeenCalledWith("request-1", "belt-green");
  });

  it("hides a request of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationRequestById: vi.fn().mockResolvedValue(farsRequestWithCoach),
    });
    const failure = await failureOf(updateRegistrationRequestBelt(repo, admin, "request-9", { beltId: "belt-green" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateRegistrationRequestBelt).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateRegistrationRequestBelt(repo, coach, "request-1", { beltId: "belt-green" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateRegistrationRequestBelt).not.toHaveBeenCalled();
  });
});

describe("approveRegistrationRequest", () => {
  it("approves a pending request of the province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const audit = auditWith();
    await approveRegistrationRequest(repo, audit, admin, "request-1");

    expect(repo.decideRegistrationRequest).toHaveBeenCalledWith("request-1", {
      status: "APPROVED",
      note: null,
      reviewedById: "admin-1",
    });
    expect(audit.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "registration_request.approved", actorId: "admin-1" }),
    );
  });

  it("rejects an admin of another province with 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationRequestById: vi.fn().mockResolvedValue(farsRequestWithCoach),
    });
    const failure = await failureOf(approveRegistrationRequest(repo, auditWith(), admin, "request-9"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.decideRegistrationRequest).not.toHaveBeenCalled();
  });

  it("answers 409 when the request was already reviewed", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideRegistrationRequest: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(approveRegistrationRequest(repo, auditWith(), admin, "request-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });
});

describe("rejectRegistrationRequest", () => {
  it("rejects a request with the required note", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await rejectRegistrationRequest(repo, auditWith(), admin, "request-1", "عکس پرسنلی ناخوانا است");

    expect(repo.decideRegistrationRequest).toHaveBeenCalledWith("request-1", {
      status: "REJECTED",
      note: "عکس پرسنلی ناخوانا است",
      reviewedById: "admin-1",
    });
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(rejectRegistrationRequest(repo, auditWith(), coach, "request-1", "نامناسب"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.decideRegistrationRequest).not.toHaveBeenCalled();
  });
});

describe("deleteStudent", () => {
  it("deletes an own student without registrations or transfer history", async () => {
    const repo = repoWith();
    const result = await deleteStudent(repo, storageWith(), coach, "student-1");

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

  it("hides another coach student behind 404", async () => {
    const repo = repoWith({ findStudentById: vi.fn().mockResolvedValue(otherCoachStudent) });
    const failure = await failureOf(deleteStudent(repo, storageWith(), coach, "student-2"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.deleteStudent).not.toHaveBeenCalled();
  });
});
