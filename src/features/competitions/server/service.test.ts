import { describe, expect, it, vi } from "vitest";
import type { Belt } from "@/features/base-data";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { CompetitionRow, CompetitionsRepository, UserIdentityRecord } from "./repository";
import {
  cancelCompetition,
  createCompetition,
  extendCompetition,
  getCompetition,
  listCompetitions,
  listDeadlineExtensions,
  publishCompetition,
  registrationState,
  updateCompetition,
} from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true };
const coachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", province: "TEHRAN", isActive: true };
const inactiveCoachRecord: UserIdentityRecord = { ...coachRecord, isActive: false };

const DAY_MS = 86_400_000;

function makeBelt(id: string, name: Belt["name"], level: number): Belt {
  return { id, name, level, order: level, rankType: level >= 6 ? "DAN" : "COLOR", color: "مشکی", colorHex: "#18181b" };
}

const belts: Belt[] = [
  makeBelt("belt-white", "WHITE", 1),
  makeBelt("belt-yellow", "YELLOW", 2),
  makeBelt("belt-green", "GREEN", 3),
  makeBelt("belt-blue", "BLUE", 4),
  makeBelt("belt-red", "RED", 5),
];

const seniorCategory = {
  id: "senior",
  name: "SENIOR" as const,
  startDate: new Date("1990-01-01T00:00:00.000Z"),
  endDate: new Date("2005-12-31T00:00:00.000Z"),
  birthYearStart: 1990,
  birthYearEnd: 2005,
};

const seniorMaleWeightClasses = [
  {
    id: "wc-senior-male-1",
    ageCategoryId: "senior",
    gender: "MALE" as const,
    label: "-54",
    minWeightKg: 0,
    maxWeightKg: 54,
    order: 1,
    excludeMin: false,
    excludeMax: true,
  },
  {
    id: "wc-senior-male-2",
    ageCategoryId: "senior",
    gender: "MALE" as const,
    label: "+54",
    minWeightKg: 54,
    maxWeightKg: null,
    order: 2,
    excludeMin: false,
    excludeMax: true,
  },
];

const coachStudents = [
  {
    id: "student-1",
    fullName: "علی رضایی",
    gender: "MALE" as const,
    birthDate: new Date("2000-05-10T00:00:00.000Z"),
    beltId: "belt-blue",
    weightKg: 60,
    profileStatus: "APPROVED" as const,
  },
  {
    id: "student-2",
    fullName: "مریم صادقی",
    gender: "FEMALE" as const,
    birthDate: new Date("2000-05-10T00:00:00.000Z"),
    beltId: "belt-blue",
    weightKg: 55,
    profileStatus: "APPROVED" as const,
  },
];

function rowWith(overrides: Partial<CompetitionRow> = {}): CompetitionRow {
  return {
    id: "comp-9",
    title: "مسابقات قهرمانی استان",
    province: "TEHRAN",
    discipline: "KYORUGI",
    gender: "MALE",
    ageCategoryId: "senior",
    minBeltId: "belt-blue",
    maxBeltId: "belt-red",
    feePerStudent: BigInt("3500000"),
    payeeCardNumber: "6104337812345678",
    payeeCardHolder: "فدراسیون تکواندو استان تهران",
    registrationDeadline: new Date(Date.now() + 7 * DAY_MS),
    eventDate: new Date(Date.now() + 14 * DAY_MS),
    status: "DRAFT",
    cancelReason: null,
    createdAt: new Date(Date.now() - DAY_MS),
    updatedAt: new Date(Date.now() - DAY_MS),
    ...overrides,
  };
}

const draftRow = rowWith();
const publishedOpenRow = rowWith({ id: "comp-1", status: "PUBLISHED" });
const publishedClosedRow = rowWith({
  id: "comp-3",
  status: "PUBLISHED",
  registrationDeadline: new Date(Date.now() - DAY_MS),
  eventDate: new Date(Date.now() + DAY_MS),
});
const farsRow = rowWith({ id: "comp-2", province: "FARS" });

function repoWith(overrides: Partial<CompetitionsRepository> = {}): CompetitionsRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    countCompetitions: vi.fn().mockResolvedValue(1),
    findCompetitions: vi.fn().mockResolvedValue([draftRow]),
    findCompetitionById: vi.fn().mockResolvedValue(draftRow),
    countRegistrations: vi.fn().mockResolvedValue(0),
    createCompetition: vi.fn().mockResolvedValue(draftRow),
    updateCompetition: vi.fn().mockImplementation(async (_id: string, data: Record<string, unknown>) => ({ ...draftRow, ...data })),
    cancelCompetitionWithRefunds: vi.fn().mockResolvedValue(null),
    extendDeadline: vi.fn().mockImplementation(async (input: { competitionId: string; newDeadline: Date }) => ({
      ...draftRow,
      id: input.competitionId,
      registrationDeadline: input.newDeadline,
    })),
    findDeadlineExtensions: vi.fn().mockResolvedValue([]),
    findAllBelts: vi.fn().mockResolvedValue(belts),
    findAllAgeCategories: vi.fn().mockResolvedValue([seniorCategory]),
    findWeightClasses: vi.fn().mockResolvedValue(seniorMaleWeightClasses),
    findCoachStudents: vi.fn().mockResolvedValue(coachStudents),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

const createInput = {
  title: "مسابقات قهرمانی استان",
  discipline: "KYORUGI" as const,
  gender: "MALE" as const,
  ageCategoryId: "senior",
  beltIds: ["belt-blue", "belt-red"],
  feePerStudent: "3500000",
  payeeCardNumber: "6104337812345678",
  payeeCardHolder: "فدراسیون تکواندو استان تهران",
  registrationDeadline: new Date(Date.now() + 7 * DAY_MS).toISOString(),
  eventDate: new Date(Date.now() + 14 * DAY_MS).toISOString(),
};

describe("registrationState", () => {
  it("reports NOT_YET_OPEN before the registration opening", () => {
    const state = registrationState(new Date("2026-01-01T00:00:00.000Z"), {
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      registrationDeadline: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(state).toBe("NOT_YET_OPEN");
  });

  it("reports OPEN between the opening and the deadline", () => {
    const state = registrationState(new Date("2026-01-15T00:00:00.000Z"), {
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      registrationDeadline: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(state).toBe("OPEN");
  });

  it("reports CLOSED after the deadline", () => {
    const state = registrationState(new Date("2026-02-02T00:00:00.000Z"), {
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
      registrationDeadline: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(state).toBe("CLOSED");
  });
});

describe("listCompetitions", () => {
  it("scopes an admin to its province and honors filters", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await listCompetitions(repo, admin, { status: "DRAFT", discipline: "KYORUGI", search: "  قهرمانی  " });

    expect(repo.findCompetitions).toHaveBeenCalledWith(
      { province: "TEHRAN", status: "DRAFT", discipline: "KYORUGI", search: "قهرمانی" },
      0,
      100,
      "createdAtDesc",
    );
    expect(result.data[0]).toMatchObject({ id: "comp-9", beltIds: ["belt-blue", "belt-red"] });
    expect(result.data[0].state).toBeUndefined();
  });

  it("forces PUBLISHED for a coach and decorates state and eligible count", async () => {
    const repo = repoWith({ findCompetitions: vi.fn().mockResolvedValue([publishedOpenRow]) });
    const result = await listCompetitions(repo, coach, { status: "DRAFT" });

    expect(repo.findCompetitions).toHaveBeenCalledWith(
      { province: "TEHRAN", status: "PUBLISHED", discipline: undefined, search: undefined },
      0,
      100,
      "deadlineAsc",
    );
    expect(result.data[0]).toMatchObject({ id: "comp-1", state: "OPEN", eligibleStudentCount: 1 });
  });

  it("marks a coach competition past its deadline as CLOSED", async () => {
    const repo = repoWith({ findCompetitions: vi.fn().mockResolvedValue([publishedClosedRow]) });
    const result = await listCompetitions(repo, coach, {});

    expect(result.data[0]).toMatchObject({ id: "comp-3", state: "CLOSED", eligibleStudentCount: 1 });
  });

  it("rejects an inactive user with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveCoachRecord) });
    const failure = await failureOf(listCompetitions(repo, coach, {}));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findCompetitions).not.toHaveBeenCalled();
  });

  it("rejects a missing user row with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(listCompetitions(repo, coach, {}));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});

describe("getCompetition", () => {
  it("returns a competition of the admin province without coach decoration", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    const result = await getCompetition(repo, admin, "comp-1");

    expect(result).toMatchObject({ id: "comp-1", status: "PUBLISHED" });
    expect(result.state).toBeUndefined();
    expect(result.eligibleStudentCount).toBeUndefined();
  });

  it("hides another province competition behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(farsRow),
    });
    const failure = await failureOf(getCompetition(repo, admin, "comp-2"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns a published competition to a coach with state and eligible count", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow) });
    const result = await getCompetition(repo, coach, "comp-1");

    expect(result).toMatchObject({ id: "comp-1", state: "OPEN", eligibleStudentCount: 1 });
  });

  it("never exposes a draft to a coach", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(draftRow) });
    const failure = await failureOf(getCompetition(repo, coach, "comp-9"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a missing competition with 404", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getCompetition(repo, coach, "comp-404"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("createCompetition", () => {
  it("creates a draft in the admin province with the resolved belt range", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, createInput);

    expect(repo.createCompetition).toHaveBeenCalledTimes(1);
    const data = vi.mocked(repo.createCompetition).mock.calls[0][0];
    expect(data).toMatchObject({
      title: "مسابقات قهرمانی استان",
      province: "TEHRAN",
      status: "DRAFT",
      minBeltId: "belt-blue",
      maxBeltId: "belt-red",
      payeeCardNumber: "6104337812345678",
    });
    expect(data.feePerStudent).toBe(BigInt("3500000"));
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCompetition(repo, coach, createInput));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createCompetition).not.toHaveBeenCalled();
  });

  it("rejects an unknown belt with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createCompetition(repo, admin, { ...createInput, beltIds: ["belt-nope"] }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createCompetition).not.toHaveBeenCalled();
  });

  it("rejects an unknown age category with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord), findAllAgeCategories: vi.fn().mockResolvedValue([]) });
    const failure = await failureOf(createCompetition(repo, admin, createInput));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("rejects an event date before the deadline with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(
      createCompetition(repo, admin, { ...createInput, eventDate: new Date(Date.now() + DAY_MS).toISOString() }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toBe("تاریخ برگزاری باید بعد از مهلت ثبت نام باشد.");
  });

  it("rejects a kyorugi competition without weight classes with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord), findWeightClasses: vi.fn().mockResolvedValue([]) });
    const failure = await failureOf(createCompetition(repo, admin, createInput));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("creates a poomsae competition without weight classes", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, { ...createInput, discipline: "POOMSAE" });

    expect(repo.findWeightClasses).not.toHaveBeenCalled();
    expect(repo.createCompetition).toHaveBeenCalled();
  });
});

describe("updateCompetition", () => {
  it("blocks the edit once the competition has registrations", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord), countRegistrations: vi.fn().mockResolvedValue(3) });
    const failure = await failureOf(updateCompetition(repo, admin, "comp-9", { title: "عنوان تازه" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قابل ویرایش نیست");
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("edits a field of an unlocked competition", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await updateCompetition(repo, admin, "comp-9", { title: "عنوان تازه" });

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { title: "عنوان تازه" });
  });

  it("resolves the belt range when the belts change", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await updateCompetition(repo, admin, "comp-9", { beltIds: ["belt-white", "belt-green"] });

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { minBeltId: "belt-white", maxBeltId: "belt-green" });
  });

  it("validates the merged dates", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(
      updateCompetition(repo, admin, "comp-9", { eventDate: new Date(Date.now() - 2 * DAY_MS).toISOString() }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateCompetition(repo, coach, "comp-9", { title: "عنوان تازه" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("hides another province competition behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(farsRow),
    });
    const failure = await failureOf(updateCompetition(repo, admin, "comp-2", { title: "عنوان تازه" }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("publishCompetition", () => {
  it("publishes a valid draft with a future deadline", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await publishCompetition(repo, admin, "comp-9");

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { status: "PUBLISHED" });
    expect(result.status).toBe("PUBLISHED");
  });

  it("rejects publishing an already published competition with 409", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    const failure = await failureOf(publishCompetition(repo, admin, "comp-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("never republishes a canceled competition", async () => {
    const canceledRow = rowWith({ id: "comp-4", status: "CANCELED", cancelReason: "دلیل" });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(canceledRow),
    });
    const failure = await failureOf(publishCompetition(repo, admin, "comp-4"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("لغو شده");
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("rejects publishing when the deadline has passed with 400", async () => {
    const staleRow = rowWith({ registrationDeadline: new Date(Date.now() - DAY_MS), eventDate: new Date(Date.now() + DAY_MS) });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(staleRow),
    });
    const failure = await failureOf(publishCompetition(repo, admin, "comp-9"));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toContain("مهلت ثبت نام");
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(publishCompetition(repo, coach, "comp-9"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("hides another province competition behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(farsRow),
    });
    const failure = await failureOf(publishCompetition(repo, admin, "comp-2"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("cancelCompetition", () => {
  it("cancels a published competition and creates refunds in the same transaction", async () => {
    const canceledRow = rowWith({ id: "comp-1", status: "CANCELED", cancelReason: "سالن مسابقه در دسترس نیست." });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
      cancelCompetitionWithRefunds: vi.fn().mockResolvedValue(canceledRow),
    });
    const result = await cancelCompetition(repo, admin, "comp-1", "سالن مسابقه در دسترس نیست.");

    expect(repo.cancelCompetitionWithRefunds).toHaveBeenCalledWith("comp-1", "سالن مسابقه در دسترس نیست.");
    expect(repo.updateCompetition).not.toHaveBeenCalled();
    expect(result.status).toBe("CANCELED");
    expect(result.cancelReason).toBe("سالن مسابقه در دسترس نیست.");
  });

  it("rejects canceling a draft with 409", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(cancelCompetition(repo, admin, "comp-9", "دلیل لغو"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.cancelCompetitionWithRefunds).not.toHaveBeenCalled();
  });

  it("rejects canceling an already canceled competition with 409", async () => {
    const canceledRow = rowWith({ status: "CANCELED", cancelReason: "دلیل" });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(canceledRow),
    });
    const failure = await failureOf(cancelCompetition(repo, admin, "comp-9", "دلیل لغو"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("reports a canceled competition when the conditional update loses a race", async () => {
    const canceledRow = rowWith({ id: "comp-1", status: "CANCELED", cancelReason: "دلیل" });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValueOnce(publishedOpenRow).mockResolvedValue(canceledRow),
      cancelCompetitionWithRefunds: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(cancelCompetition(repo, admin, "comp-1", "دلیل لغو"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلاً لغو شده");
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow) });
    const failure = await failureOf(cancelCompetition(repo, coach, "comp-1", "دلیل لغو"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.cancelCompetitionWithRefunds).not.toHaveBeenCalled();
  });
});

describe("extendCompetition", () => {
  const extendInput = { newDeadline: new Date(Date.now() + 10 * DAY_MS).toISOString(), reason: "تمدید به دلیل درخواست هیئت ها" };

  it("stores the previous deadline, new deadline, reason and admin and updates the deadline", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    const result = await extendCompetition(repo, admin, "comp-1", extendInput);

    expect(repo.extendDeadline).toHaveBeenCalledWith({
      competitionId: "comp-1",
      previousDeadline: publishedOpenRow.registrationDeadline,
      newDeadline: new Date(extendInput.newDeadline),
      reopenForRejected: false,
      reason: extendInput.reason,
      createdById: "admin-1",
    });
    expect(result.registrationDeadline).toEqual(new Date(extendInput.newDeadline));
  });

  it("keeps reopenForRejected true when requested", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    await extendCompetition(repo, admin, "comp-1", { ...extendInput, reopenForRejected: true });

    expect(repo.extendDeadline).toHaveBeenCalledWith(expect.objectContaining({ reopenForRejected: true }));
  });

  it("rejects a new deadline before or at the current deadline with 400", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    const failure = await failureOf(
      extendCompetition(repo, admin, "comp-1", { ...extendInput, newDeadline: publishedOpenRow.registrationDeadline.toISOString() }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toContain("بعد از مهلت فعلی");
    expect(repo.extendDeadline).not.toHaveBeenCalled();
  });

  it("rejects a new deadline at or after the event date with 400", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    const failure = await failureOf(
      extendCompetition(repo, admin, "comp-1", { ...extendInput, newDeadline: publishedOpenRow.eventDate.toISOString() }),
    );

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toContain("قبل از تاریخ برگزاری");
    expect(repo.extendDeadline).not.toHaveBeenCalled();
  });

  it("rejects extending a canceled competition with 409", async () => {
    const canceledRow = rowWith({ id: "comp-4", status: "CANCELED", cancelReason: "دلیل" });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(canceledRow),
    });
    const failure = await failureOf(extendCompetition(repo, admin, "comp-4", extendInput));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("لغو شده");
    expect(repo.extendDeadline).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(extendCompetition(repo, coach, "comp-9", extendInput));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.extendDeadline).not.toHaveBeenCalled();
  });

  it("hides another province competition behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(farsRow),
    });
    const failure = await failureOf(extendCompetition(repo, admin, "comp-2", extendInput));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.extendDeadline).not.toHaveBeenCalled();
  });

  it("allows extending a published competition whose deadline already passed", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedClosedRow),
    });
    const between = new Date(Date.now() + 12 * 3_600_000).toISOString();
    const result = await extendCompetition(repo, admin, "comp-3", { ...extendInput, newDeadline: between });

    expect(repo.extendDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ previousDeadline: publishedClosedRow.registrationDeadline }),
    );
    expect(result.registrationDeadline).toEqual(new Date(between));
  });
});

describe("listDeadlineExtensions", () => {
  it("returns the extension history of the competition", async () => {
    const history = [
      {
        id: "ext-1",
        previousDeadline: publishedOpenRow.registrationDeadline,
        newDeadline: new Date(Date.now() + 10 * DAY_MS),
        reopenForRejected: true,
        reason: "تمدید به دلیل درخواست هیئت ها",
        createdByName: "مدیر استان",
        createdAt: new Date(),
      },
    ];
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
      findDeadlineExtensions: vi.fn().mockResolvedValue(history),
    });
    const result = await listDeadlineExtensions(repo, admin, "comp-1");

    expect(repo.findDeadlineExtensions).toHaveBeenCalledWith("comp-1");
    expect(result).toEqual(history);
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(listDeadlineExtensions(repo, coach, "comp-9"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findDeadlineExtensions).not.toHaveBeenCalled();
  });

  it("hides another province competition behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(farsRow),
    });
    const failure = await failureOf(listDeadlineExtensions(repo, admin, "comp-2"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.findDeadlineExtensions).not.toHaveBeenCalled();
  });
});
