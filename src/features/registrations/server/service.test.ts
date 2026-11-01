import { describe, expect, it, vi } from "vitest";
import type { Belt, WeightClass } from "@/features/base-data";
import type { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type {
  ParticipantRow,
  RegistrationRepository,
  RegistrationStudentRow,
  RegistrationTransitionInput,
  RegistrationWithScope,
} from "./repository";
import {
  approveRegistration,
  createRegistrations,
  getRegistration,
  getRegistrationDetail,
  listParticipants,
  listRegistrations,
  rejectRegistration,
} from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const coachRecord = {
  id: "coach-1",
  role: "COACH" as const,
  province: "TEHRAN" as const,
  isActive: true,
  countyId: "county-tehran",
};
const adminRecord = {
  id: "admin-1",
  role: "ADMIN" as const,
  province: "TEHRAN" as const,
  isActive: true,
  countyId: null,
};
const inactiveRecord = { ...coachRecord, isActive: false };

const belts: Belt[] = [
  { id: "belt-white", name: "WHITE", level: 1, order: 1, rankType: "COLOR", color: null, colorHex: null },
  { id: "belt-yellow", name: "YELLOW", level: 2, order: 2, rankType: "COLOR", color: null, colorHex: null },
  { id: "belt-green", name: "GREEN", level: 3, order: 3, rankType: "COLOR", color: null, colorHex: null },
  { id: "belt-blue", name: "BLUE", level: 4, order: 4, rankType: "COLOR", color: null, colorHex: null },
  { id: "belt-dan-1", name: "DAN_1", level: 10, order: 5, rankType: "DAN", color: null, colorHex: null },
];

function weightClass(id: string, min: number, max: number | null): WeightClass {
  return {
    id,
    ageCategoryId: "cadet",
    gender: "MALE",
    label: `${min}`,
    minWeightKg: min,
    maxWeightKg: max,
    order: 1,
    excludeMin: false,
    excludeMax: true,
  };
}

const weightClasses: WeightClass[] = [weightClass("wc-light", 30, 33), weightClass("wc-middle", 33, 37), weightClass("wc-heavy", 37, null)];

const ageCategoryRow = {
  id: "cadet",
  name: "CADET" as const,
  startDate: new Date("2012-01-01T00:00:00.000Z"),
  endDate: new Date("2014-12-31T00:00:00.000Z"),
};

const competition = {
  id: "comp-1",
  province: "TEHRAN" as const,
  level: "PROVINCIAL" as const,
  hostCountyId: null,
  status: "PUBLISHED" as const,
  discipline: "KYORUGI" as const,
  gender: "MALE" as const,
  ageCategoryId: "cadet",
  minBeltId: "belt-yellow",
  maxBeltId: "belt-blue",
  feePerStudent: BigInt(2500000),
  registrationDeadline: new Date("2026-11-20T20:30:00.000Z"),
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
};

const createdAt = new Date("2026-10-20T09:00:00.000Z");

const studentRow: RegistrationStudentRow = {
  id: "student-1",
  fullName: "علی محمدی",
  gender: "MALE",
  birthDate: new Date("2013-05-10T00:00:00.000Z"),
  beltId: "belt-green",
  weightKg: 35,
  profileStatus: "APPROVED",
};

const secondStudent: RegistrationStudentRow = { ...studentRow, id: "student-2", fullName: "سینا مرادی" };

const studentInfo = { id: "student-1", fullName: "علی محمدی", beltId: "belt-green", weightKg: 35 };

const registrationRow: RegistrationWithScope = {
  id: "reg-1",
  competitionId: "comp-1",
  studentId: "student-1",
  coachId: "coach-1",
  paymentId: "pay-1",
  weightClassId: "wc-middle",
  status: "PENDING",
  note: null,
  createdAt,
  updatedAt: createdAt,
  student: studentInfo,
  coachProvince: "TEHRAN",
  paymentStatus: "PENDING",
};

const bundle = {
  payment: {
    id: "pay-9",
    competitionId: "comp-1",
    coachId: "coach-1",
    amount: "5000000",
    receiptKey: "file-1",
    status: "PENDING" as const,
    note: null,
    createdAt,
    updatedAt: createdAt,
  },
  registrations: [
    registrationRow,
    { ...registrationRow, id: "reg-2", studentId: "student-2", student: { ...studentInfo, id: "student-2", fullName: "سینا مرادی" } },
  ],
};

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

function receiptFile(bytes: Uint8Array<ArrayBuffer> = PNG_BYTES): File {
  return new File([bytes], "receipt.png", { type: "image/png" });
}

function repoWith(overrides: Partial<RegistrationRepository> = {}): RegistrationRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    findCompetitionById: vi.fn().mockResolvedValue(competition),
    findCompetitionTitleById: vi.fn().mockResolvedValue("مسابقات قهرمانی استان"),
    findApprovedParticipants: vi.fn().mockResolvedValue([]),
    findAgeCategoryById: vi.fn().mockResolvedValue(ageCategoryRow),
    findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow, secondStudent]),
    findAllBelts: vi.fn().mockResolvedValue(belts),
    findWeightClasses: vi.fn().mockResolvedValue(weightClasses),
    findActiveRegisteredStudentIds: vi.fn().mockResolvedValue([]),
    findLatestRejectionsByStudentIds: vi.fn().mockResolvedValue([]),
    findLatestDeadlineExtension: vi.fn().mockResolvedValue(null),
    countRegistrations: vi.fn().mockResolvedValue(1),
    findRegistrations: vi.fn().mockResolvedValue([registrationRow]),
    findRegistrationById: vi.fn().mockResolvedValue(registrationRow),
    findRegistrationDetailById: vi.fn().mockResolvedValue({
      registration: registrationRow,
      competition: { id: "comp-1", title: "مسابقات قهرمانی استان تهران", registrationDeadline: competition.registrationDeadline },
      weightClassLabel: "۳۳",
      payment: { id: "pay-1", status: "PENDING" as const, amount: BigInt(5000000), createdAt },
      bundle: [
        { id: "reg-1", studentName: "علی محمدی", status: "PENDING" as const, note: null },
        { id: "reg-2", studentName: "سینا مرادی", status: "PENDING" as const, note: null },
      ],
    }),
    createRegistrationBundle: vi.fn().mockResolvedValue(bundle),
    transitionRegistrationFromPending: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function storageWith(overrides: Partial<Storage> = {}): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "file-1", mime: "image/png", size: PNG_BYTES.byteLength }),
    get: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("listRegistrations", () => {
  it("forces a coach to its own registrations and ignores the coachId param", async () => {
    const repo = repoWith();
    await listRegistrations(repo, coach, { coachId: "coach-2", competitionId: "comp-1" });

    expect(repo.findRegistrations).toHaveBeenCalledWith(
      { coachId: "coach-1", competitionId: "comp-1", paymentId: undefined, status: undefined },
      0,
      100,
    );
    expect(repo.countRegistrations).toHaveBeenCalledWith({
      coachId: "coach-1",
      competitionId: "comp-1",
      paymentId: undefined,
      status: undefined,
    });
  });

  it("scopes an admin to its province and keeps the coachId filter", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listRegistrations(repo, admin, { coachId: "coach-2", status: "APPROVED" });

    expect(repo.findRegistrations).toHaveBeenCalledWith(
      { province: "TEHRAN", coachId: "coach-2", competitionId: undefined, paymentId: undefined, status: "APPROVED" },
      0,
      100,
    );
  });

  it("rejects an inactive user with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveRecord) });
    const failure = await failureOf(listRegistrations(repo, coach, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("getRegistration", () => {
  it("returns an own registration to the coach", async () => {
    const repo = repoWith();
    const record = await getRegistration(repo, coach, "reg-1");

    expect(record.id).toBe("reg-1");
  });

  it("hides another coach registration from a coach with 404", async () => {
    const repo = repoWith({ findRegistrationById: vi.fn().mockResolvedValue({ ...registrationRow, coachId: "coach-2" }) });
    const failure = await failureOf(getRegistration(repo, coach, "reg-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("hides registrations outside the admin province with 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationById: vi.fn().mockResolvedValue({ ...registrationRow, coachProvince: "FARS" }),
    });
    const failure = await failureOf(getRegistration(repo, admin, "reg-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("createRegistrations", () => {
  it("creates one payment and one registration per eligible student with resolved weight class", async () => {
    const repo = repoWith();
    const storage = storageWith();
    const result = await createRegistrations(repo, storage, coach, "comp-1", {
      studentIds: ["student-1", "student-2"],
      receipt: receiptFile(),
    });

    expect(storage.put).toHaveBeenCalledWith({ data: PNG_BYTES, mime: "image/png" });
    expect(repo.createRegistrationBundle).toHaveBeenCalledWith({
      competitionId: "comp-1",
      coachId: "coach-1",
      amount: BigInt(5000000),
      receiptKey: "file-1",
      students: [
        { studentId: "student-1", weightClassId: "wc-middle" },
        { studentId: "student-2", weightClassId: "wc-middle" },
      ],
    });
    expect(result.payment.amount).toBe("5000000");
    expect(result.registrations).toHaveLength(2);
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), admin, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("hides competitions of another province with 404", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue({ ...competition, province: "FARS" }) });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("blocks a coach from another county with 403 on a county competition", async () => {
    const repo = repoWith({
      findCompetitionById: vi.fn().mockResolvedValue({ ...competition, level: "COUNTY", hostCountyId: "county-ray" }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect((failure as AppError).message).toContain("شهرستان میزبان");
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("allows a coach of the host county to register in a county competition", async () => {
    const repo = repoWith({
      findCompetitionById: vi.fn().mockResolvedValue({ ...competition, level: "COUNTY", hostCountyId: "county-tehran" }),
    });
    await createRegistrations(repo, storageWith(), coach, "comp-1", {
      studentIds: ["student-1", "student-2"],
      receipt: receiptFile(),
    });

    expect(repo.createRegistrationBundle).toHaveBeenCalledTimes(1);
  });

  it("blocks a coach without a county from a county competition with 403", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue({ ...coachRecord, countyId: null }),
      findCompetitionById: vi.fn().mockResolvedValue({ ...competition, level: "COUNTY", hostCountyId: "county-ray" }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("blocks a draft competition", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue({ ...competition, status: "DRAFT" }) });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("blocks a closed deadline", async () => {
    const repo = repoWith({
      findCompetitionById: vi.fn().mockResolvedValue({ ...competition, registrationDeadline: new Date("2026-10-01T00:00:00.000Z") }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("مهلت");
  });

  it("blocks before the registration opens", async () => {
    const repo = repoWith({
      findCompetitionById: vi.fn().mockResolvedValue({ ...competition, createdAt: new Date("2300-01-01T00:00:00.000Z") }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect((failure as AppError).message).toContain("آغاز");
  });

  it("rejects a receipt that is not a real image before touching students", async () => {
    const repo = repoWith();
    const textFile = new File([new TextEncoder().encode("not an image")], "receipt.png", { type: "image/png" });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: textFile }),
    );

    expect(failure).toMatchObject({ status: 400, code: "INVALID_FILE_TYPE" });
    expect(repo.findCoachStudentsByIds).not.toHaveBeenCalled();
  });

  it("allows only the coach's own students", async () => {
    const repo = repoWith({ findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]) });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1", "other"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("blocks duplicates with per-student reasons", async () => {
    const repo = repoWith({ findActiveRegisteredStudentIds: vi.fn().mockResolvedValue(["student-1"]) });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1", "student-2"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).details).toEqual([
      { studentId: "student-1", fullName: "علی محمدی", reason: "این هنرجو قبلا در این مسابقه ثبت نام شده است." },
    ]);
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("blocks a rejected registration when no extension exists", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]),
      findLatestRejectionsByStudentIds: vi
        .fn()
        .mockResolvedValue([{ studentId: "student-1", rejectedAt: new Date("2026-10-25T10:00:00.000Z") }]),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).details).toEqual([
      {
        studentId: "student-1",
        fullName: "علی محمدی",
        reason: "ثبت نام قبلی این هنرجو رد شده و مهلت جدیدی برای ثبت نام مجدد او باز نشده است.",
      },
    ]);
    expect(repo.findLatestDeadlineExtension).toHaveBeenCalledWith("comp-1");
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("blocks a rejected registration when the latest extension did not reopen", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]),
      findLatestRejectionsByStudentIds: vi
        .fn()
        .mockResolvedValue([{ studentId: "student-1", rejectedAt: new Date("2026-10-25T10:00:00.000Z") }]),
      findLatestDeadlineExtension: vi.fn().mockResolvedValue({ reopenForRejected: false, createdAt: new Date("2026-10-26T10:00:00.000Z") }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("blocks a rejected registration when the reopen extension was created before the rejection", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]),
      findLatestRejectionsByStudentIds: vi
        .fn()
        .mockResolvedValue([{ studentId: "student-1", rejectedAt: new Date("2026-10-27T10:00:00.000Z") }]),
      findLatestDeadlineExtension: vi.fn().mockResolvedValue({ reopenForRejected: true, createdAt: new Date("2026-10-26T10:00:00.000Z") }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("re-registers a rejected student when the latest extension reopened after that rejection", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]),
      findLatestRejectionsByStudentIds: vi
        .fn()
        .mockResolvedValue([{ studentId: "student-1", rejectedAt: new Date("2026-10-25T10:00:00.000Z") }]),
      findLatestDeadlineExtension: vi.fn().mockResolvedValue({ reopenForRejected: true, createdAt: new Date("2026-10-26T10:00:00.000Z") }),
    });
    await createRegistrations(repo, storageWith(), coach, "comp-1", {
      studentIds: ["student-1"],
      receipt: receiptFile(),
    });

    expect(repo.createRegistrationBundle).toHaveBeenCalledWith(
      expect.objectContaining({ students: [{ studentId: "student-1", weightClassId: "wc-middle" }] }),
    );
  });

  it("uses the latest rejection when a student has several rejected registrations", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]),
      findLatestRejectionsByStudentIds: vi
        .fn()
        .mockResolvedValue([{ studentId: "student-1", rejectedAt: new Date("2026-10-27T10:00:00.000Z") }]),
      findLatestDeadlineExtension: vi.fn().mockResolvedValue({ reopenForRejected: true, createdAt: new Date("2026-10-26T10:00:00.000Z") }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("keeps blocking an active registration even when a reopen extension exists", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]),
      findActiveRegisteredStudentIds: vi.fn().mockResolvedValue(["student-1"]),
      findLatestRejectionsByStudentIds: vi
        .fn()
        .mockResolvedValue([{ studentId: "student-1", rejectedAt: new Date("2026-10-25T10:00:00.000Z") }]),
      findLatestDeadlineExtension: vi.fn().mockResolvedValue({ reopenForRejected: true, createdAt: new Date("2026-10-26T10:00:00.000Z") }),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).details).toEqual([
      { studentId: "student-1", fullName: "علی محمدی", reason: "این هنرجو قبلا در این مسابقه ثبت نام شده است." },
    ]);
  });

  it("does not load the extension when no rejected registration exists", async () => {
    const repo = repoWith({ findCoachStudentsByIds: vi.fn().mockResolvedValue([studentRow]) });
    await createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1"], receipt: receiptFile() });

    expect(repo.findLatestDeadlineExtension).not.toHaveBeenCalled();
  });

  it("rejects the whole request with per-student reasons when one student is ineligible", async () => {
    const repo = repoWith({
      findCoachStudentsByIds: vi
        .fn()
        .mockResolvedValue([studentRow, { ...secondStudent, birthDate: new Date("2010-01-01T00:00:00.000Z") }]),
    });
    const failure = await failureOf(
      createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1", "student-2"], receipt: receiptFile() }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    const details = (failure as AppError).details as Array<{ studentId: string; reason: string }>;
    expect(details).toHaveLength(1);
    expect(details[0].studentId).toBe("student-2");
    expect(details[0].reason).toContain("سنی");
    expect(repo.createRegistrationBundle).not.toHaveBeenCalled();
  });

  it("resolves no weight class for poomsae", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue({ ...competition, discipline: "POOMSAE" }) });
    await createRegistrations(repo, storageWith(), coach, "comp-1", { studentIds: ["student-1", "student-2"], receipt: receiptFile() });

    expect(repo.createRegistrationBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        students: [
          { studentId: "student-1", weightClassId: null },
          { studentId: "student-2", weightClassId: null },
        ],
      }),
    );
  });
});

describe("getRegistrationDetail", () => {
  it("returns the bundle with payment status to the owning coach", async () => {
    const repo = repoWith();
    const detail = await getRegistrationDetail(repo, coach, "reg-1");

    expect(detail.registration.student.fullName).toBe("علی محمدی");
    expect(detail.payment?.status).toBe("PENDING");
    expect(detail.bundle).toHaveLength(2);
  });

  it("hides another coach registration from a coach with 404", async () => {
    const repo = repoWith({
      findRegistrationDetailById: vi.fn().mockResolvedValue({
        registration: { ...registrationRow, coachId: "coach-2" },
        competition: null,
        weightClassLabel: null,
        payment: null,
        bundle: [],
      }),
    });
    const failure = await failureOf(getRegistrationDetail(repo, coach, "reg-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("hides registrations outside the admin province with 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationDetailById: vi.fn().mockResolvedValue({
        registration: { ...registrationRow, coachProvince: "FARS" },
        competition: null,
        weightClassLabel: null,
        payment: null,
        bundle: [],
      }),
    });
    const failure = await failureOf(getRegistrationDetail(repo, admin, "reg-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("approveRegistration", () => {
  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(approveRegistration(repo, coach, "reg-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.transitionRegistrationFromPending).not.toHaveBeenCalled();
  });

  it("hides registrations of another province from the admin with 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationById: vi.fn().mockResolvedValue({ ...registrationRow, coachProvince: "FARS" }),
    });
    const failure = await failureOf(approveRegistration(repo, admin, "reg-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.transitionRegistrationFromPending).not.toHaveBeenCalled();
  });

  it("approves a pending registration of a confirmed payment inside a conditional transaction", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationById: vi.fn().mockResolvedValue({ ...registrationRow, paymentStatus: "CONFIRMED" }),
      transitionRegistrationFromPending: vi.fn().mockResolvedValue({
        kind: "updated",
        row: { ...registrationRow, status: "APPROVED", paymentStatus: "CONFIRMED" },
      }),
    });
    const record = await approveRegistration(repo, admin, "reg-1");

    expect(repo.transitionRegistrationFromPending).toHaveBeenCalledWith("reg-1", { status: "APPROVED", note: null, createRefund: false });
    expect(record.status).toBe("APPROVED");
  });

  it("blocks approving before the payment receipt is confirmed", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionRegistrationFromPending: vi.fn().mockResolvedValue({
        kind: "conflict",
        reason: "PAYMENT_NOT_CONFIRMED",
        row: registrationRow,
      }),
    });
    const failure = await failureOf(approveRegistration(repo, admin, "reg-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("رسید پرداخت");
  });

  it("blocks a second decision on a decided registration", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionRegistrationFromPending: vi.fn().mockResolvedValue({
        kind: "conflict",
        reason: "REVIEWED",
        row: { ...registrationRow, status: "APPROVED" },
      }),
    });
    const failure = await failureOf(approveRegistration(repo, admin, "reg-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلا بررسی شده");
  });

  it("applies the transition only once when two requests race", async () => {
    let row: RegistrationWithScope = { ...registrationRow, paymentStatus: "CONFIRMED" };
    const transition = vi.fn().mockImplementation(async (_id: string, input: RegistrationTransitionInput) => {
      if (row.status !== "PENDING" || row.paymentStatus !== "CONFIRMED") {
        return { kind: "conflict", reason: row.status !== "PENDING" ? "REVIEWED" : "PAYMENT_NOT_CONFIRMED", row };
      }
      row = { ...row, status: input.status, note: input.note };
      return { kind: "updated", row };
    });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationById: vi.fn().mockImplementation(async () => row),
      transitionRegistrationFromPending: transition,
    });

    const [first, second] = await Promise.all([
      approveRegistration(repo, admin, "reg-1"),
      approveRegistration(repo, admin, "reg-1").catch((error: unknown) => error),
    ]);

    expect(first).toMatchObject({ status: "APPROVED" });
    expect(second).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(transition).toHaveBeenCalledTimes(2);
  });
});

describe("rejectRegistration", () => {
  it("rejects a registration with a note after the payment is confirmed", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRegistrationById: vi.fn().mockResolvedValue({ ...registrationRow, paymentStatus: "CONFIRMED" }),
      transitionRegistrationFromPending: vi.fn().mockResolvedValue({
        kind: "updated",
        row: { ...registrationRow, status: "REJECTED", note: "رده وزنی با مسابقه همخوانی ندارد.", paymentStatus: "CONFIRMED" },
      }),
    });
    const record = await rejectRegistration(repo, admin, "reg-1", "رده وزنی با مسابقه همخوانی ندارد.");

    expect(repo.transitionRegistrationFromPending).toHaveBeenCalledWith("reg-1", {
      status: "REJECTED",
      note: "رده وزنی با مسابقه همخوانی ندارد.",
      createRefund: true,
    });
    expect(record.status).toBe("REJECTED");
    expect(record.note).toBe("رده وزنی با مسابقه همخوانی ندارد.");
  });

  it("blocks rejecting before the payment receipt is confirmed", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionRegistrationFromPending: vi.fn().mockResolvedValue({
        kind: "conflict",
        reason: "PAYMENT_NOT_CONFIRMED",
        row: registrationRow,
      }),
    });
    const failure = await failureOf(rejectRegistration(repo, admin, "reg-1", "نامناسب"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("رسید پرداخت");
    expect(repo.transitionRegistrationFromPending).toHaveBeenCalledWith("reg-1", {
      status: "REJECTED",
      note: "نامناسب",
      createRefund: false,
    });
  });
});

const adminRecordOtherProvince = { id: "admin-2", role: "ADMIN" as const, province: "FARS" as const, isActive: true };

function participantRow(overrides: Partial<ParticipantRow> = {}): ParticipantRow {
  return {
    id: "reg-p1",
    student: {
      id: "student-1",
      fullName: "علی محمدی",
      nationalCode: "0012345678",
      birthDate: new Date("2013-05-10T00:00:00.000Z"),
      beltName: "GREEN",
    },
    coachName: "رضا کریمی",
    weightClass: { label: "۳۳", order: 2 },
    ...overrides,
  };
}

describe("listParticipants", () => {
  it("returns approved participants sorted by weight class order then Persian name", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findApprovedParticipants: vi.fn().mockResolvedValue([
        participantRow({
          id: "reg-3",
          weightClass: { label: "۳۷", order: 3 },
          student: { ...participantRow().student, fullName: "اکبر احمدی" },
        }),
        participantRow({
          id: "reg-1",
          weightClass: { label: "۳۳", order: 2 },
          student: { ...participantRow().student, fullName: "مهدی کریمی" },
        }),
        participantRow({
          id: "reg-2",
          weightClass: { label: "۳۳", order: 2 },
          student: { ...participantRow().student, fullName: "علی رضایی" },
        }),
        participantRow({ id: "reg-4", weightClass: null, student: { ...participantRow().student, fullName: "سینا مرادی" } }),
      ]),
    });

    const participants = await listParticipants(repo, admin, "comp-1");

    expect(participants.map((participant) => participant.registrationId)).toEqual(["reg-2", "reg-1", "reg-3", "reg-4"]);
    expect(participants[0]).toMatchObject({
      registrationId: "reg-2",
      fullName: "علی رضایی",
      nationalCode: "0012345678",
      beltName: "GREEN",
      weightClassLabel: "۳۳",
      coachName: "رضا کریمی",
    });
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(coachRecord) });
    const failure = await failureOf(listParticipants(repo, coach, "comp-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findApprovedParticipants).not.toHaveBeenCalled();
  });

  it("rejects an inactive admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, isActive: false }) });
    const failure = await failureOf(listParticipants(repo, admin, "comp-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("hides competitions of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecordOtherProvince),
      findCompetitionById: vi.fn().mockResolvedValue(competition),
    });
    const failure = await failureOf(listParticipants(repo, { id: "admin-2", role: "ADMIN" }, "comp-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.findApprovedParticipants).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing competition", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(listParticipants(repo, admin, "missing"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns an empty list when no registration is approved", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const participants = await listParticipants(repo, admin, "comp-1");

    expect(participants).toEqual([]);
  });
});
