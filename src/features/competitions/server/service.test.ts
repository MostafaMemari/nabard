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

const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", gender: null, province: "TEHRAN", isActive: true, countyId: null };
const coachRecord: UserIdentityRecord = {
  id: "coach-1",
  role: "COACH",
  gender: "MALE",
  province: "TEHRAN",
  isActive: true,
  countyId: "county-tehran",
};
const inactiveCoachRecord: UserIdentityRecord = { ...coachRecord, isActive: false };

const DAY_MS = 86_400_000;

function makeBelt(id: string, code: string, level: number): Belt {
  return {
    id,
    code,
    label: code,
    level,
    order: level,
    rankType: level >= 6 ? "DAN" : "COLOR",
    color: "مشکی",
    colorHex: "#18181b",
    isActive: true,
  };
}

const belts: Belt[] = [
  makeBelt("belt-white", "white", 1),
  makeBelt("belt-yellow", "yellow", 2),
  makeBelt("belt-green", "green", 3),
  makeBelt("belt-blue", "blue", 4),
  makeBelt("belt-red", "red", 5),
];

const seniorCategory = {
  id: "senior",
  code: "senior",
  label: "بزرگسال",
  startDate: new Date("1990-01-01T00:00:00.000Z"),
  endDate: new Date("2005-12-31T00:00:00.000Z"),
  birthYearStart: 1368,
  birthYearEnd: 1384,
  isActive: true,
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
    isActive: true,
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
    isActive: true,
  },
];

const coachStudents = [
  {
    id: "student-1",
    fullName: "علی رضایی",
    gender: "MALE" as const,
    birthDate: new Date("2000-05-10T00:00:00.000Z"),
    beltId: "belt-blue",
    profileStatus: "APPROVED" as const,
  },
  {
    id: "student-2",
    fullName: "مریم صادقی",
    gender: "FEMALE" as const,
    birthDate: new Date("2000-05-10T00:00:00.000Z"),
    beltId: "belt-blue",
    profileStatus: "APPROVED" as const,
  },
];

const tehranCounty = { id: "county-tehran", province: "TEHRAN" as const, name: "تهران" };
const rayCounty = { id: "county-ray", province: "TEHRAN" as const, name: "ری" };
const shirazCounty = { id: "county-shiraz", province: "FARS" as const, name: "شیراز" };

function rowWith(overrides: Partial<CompetitionRow> = {}): CompetitionRow {
  return {
    id: "comp-9",
    title: "مسابقات قهرمانی استان",
    description: null,
    province: "TEHRAN",
    level: "PROVINCIAL",
    countyIds: [],
    countyNames: [],
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
    rules: null,
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
    findCountyById: vi
      .fn()
      .mockImplementation(async (id: string) =>
        id === tehranCounty.id ? tehranCounty : id === rayCounty.id ? rayCounty : id === shirazCounty.id ? shirazCounty : null,
      ),
    countCompetitions: vi.fn().mockResolvedValue(1),
    findCompetitions: vi.fn().mockResolvedValue([draftRow]),
    findCompetitionById: vi.fn().mockResolvedValue(draftRow),
    countRegistrations: vi.fn().mockResolvedValue(0),
    createCompetition: vi.fn().mockResolvedValue(draftRow),
    updateCompetition: vi.fn().mockImplementation(async (_id: string, data: Record<string, unknown>) => ({ ...draftRow, ...data })),
    publishWithRulesSnapshot: vi.fn().mockResolvedValue(null),
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
  level: "PROVINCIAL" as const,
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
      { province: "TEHRAN", status: "PUBLISHED", discipline: undefined, gender: "MALE", search: undefined, coachCountyId: "county-tehran" },
      0,
      100,
      "deadlineAsc",
    );
    expect(result.data[0]).toMatchObject({ id: "comp-1", state: "OPEN", eligibleStudentCount: 1 });
  });

  it("only lists competitions matching the coach gender", async () => {
    const repo = repoWith({ findCompetitions: vi.fn().mockResolvedValue([]) });
    await listCompetitions(repo, coach, {});

    expect(repo.findCompetitions).toHaveBeenCalledWith(
      { province: "TEHRAN", status: "PUBLISHED", discipline: undefined, gender: "MALE", search: undefined, coachCountyId: "county-tehran" },
      0,
      100,
      "deadlineAsc",
    );
  });

  it("lists nothing for a coach whose gender is missing", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...coachRecord, gender: null }) });
    const result = await listCompetitions(repo, coach, {});

    expect(result.data).toEqual([]);
    expect(result.meta).toMatchObject({ page: 1, pageSize: 100, total: 0 });
    expect(repo.findCompetitions).not.toHaveBeenCalled();
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

  it("hides an opposite gender competition behind 404 for a coach", async () => {
    const femaleRow = rowWith({ id: "comp-6", status: "PUBLISHED", gender: "FEMALE" });
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(femaleRow) });
    const failure = await failureOf(getCompetition(repo, coach, "comp-6"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a missing competition with 404", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getCompetition(repo, coach, "comp-404"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("county competitions", () => {
  const countyRow = rowWith({
    id: "comp-5",
    status: "PUBLISHED",
    level: "COUNTY",
    countyIds: [rayCounty.id],
    countyNames: [rayCounty.name],
  });

  it("sends the coach county filter so only provincial and listed-county rows are returned", async () => {
    const repo = repoWith();
    await listCompetitions(repo, coach, {});

    const filters = vi.mocked(repo.countCompetitions).mock.calls[0][0];
    expect(filters).toMatchObject({ province: "TEHRAN", status: "PUBLISHED", coachCountyId: "county-tehran" });
  });

  it("hides a county competition outside the coach county behind 404 on details", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(countyRow) });
    const failure = await failureOf(getCompetition(repo, coach, "comp-5"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns a county competition that lists the coach county", async () => {
    const ownCountyRow = rowWith({
      id: "comp-5",
      status: "PUBLISHED",
      level: "COUNTY",
      countyIds: [tehranCounty.id, rayCounty.id],
      countyNames: [tehranCounty.name, rayCounty.name],
    });
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(ownCountyRow) });
    const result = await getCompetition(repo, coach, "comp-5");

    expect(result).toMatchObject({ id: "comp-5", level: "COUNTY", countyNames: ["تهران", "ری"], eligibleStudentCount: 1 });
  });

  it("always shows provincial competitions to the coach", async () => {
    const repo = repoWith({ findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow) });
    const result = await getCompetition(repo, coach, "comp-1");

    expect(result).toMatchObject({ id: "comp-1", level: "PROVINCIAL" });
  });

  it("creates a county competition only with counties of the admin province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, { ...createInput, level: "COUNTY", countyIds: [tehranCounty.id, rayCounty.id] });

    const data = vi.mocked(repo.createCompetition).mock.calls[0][0];
    expect(data).toMatchObject({ level: "COUNTY", countyIds: ["county-tehran", "county-ray"] });
  });

  it("rejects a county of another province with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createCompetition(repo, admin, { ...createInput, level: "COUNTY", countyIds: [shirazCounty.id] }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createCompetition).not.toHaveBeenCalled();
  });

  it("rejects an unknown county with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createCompetition(repo, admin, { ...createInput, level: "COUNTY", countyIds: ["county-nope"] }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("rejects a county competition without any county with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createCompetition(repo, admin, { ...createInput, level: "COUNTY", countyIds: [] }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect((failure as AppError).message).toContain("حداقل یک شهرستان");
  });

  it("drops duplicate counties and keeps the order", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, { ...createInput, level: "COUNTY", countyIds: [rayCounty.id, rayCounty.id] });

    const data = vi.mocked(repo.createCompetition).mock.calls[0][0];
    expect(data.countyIds).toEqual(["county-ray"]);
  });

  it("ignores the counties of a provincial competition", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, { ...createInput, level: "PROVINCIAL", countyIds: [tehranCounty.id] });

    const data = vi.mocked(repo.createCompetition).mock.calls[0][0];
    expect(data).toMatchObject({ level: "PROVINCIAL", countyIds: [] });
  });

  it("rejects a level change to county without any county with 400", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(updateCompetition(repo, admin, "comp-9", { level: "COUNTY" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("replaces the county list on edit", async () => {
    const countyDraft = rowWith({ level: "COUNTY", countyIds: [rayCounty.id], countyNames: [rayCounty.name] });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(countyDraft),
    });
    await updateCompetition(repo, admin, "comp-9", { countyIds: [tehranCounty.id] });

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { countyIds: ["county-tehran"] });
  });

  it("clears the counties when the level moves back to provincial", async () => {
    const countyDraft = rowWith({ level: "COUNTY", countyIds: [rayCounty.id], countyNames: [rayCounty.name] });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(countyDraft),
    });
    await updateCompetition(repo, admin, "comp-9", { level: "PROVINCIAL" });

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { level: "PROVINCIAL", countyIds: [] });
  });

  it("keeps level and county list locked once registrations exist", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      countRegistrations: vi.fn().mockResolvedValue(3),
    });
    const failure = await failureOf(updateCompetition(repo, admin, "comp-9", { level: "COUNTY", countyIds: [rayCounty.id] }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
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

  it("stores the optional description for coaches", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, { ...createInput, description: "سالن انقلاب، ساعت ۸ صبح" });

    expect(repo.createCompetition).toHaveBeenCalledTimes(1);
    expect(vi.mocked(repo.createCompetition).mock.calls[0][0].description).toBe("سالن انقلاب، ساعت ۸ صبح");
  });

  it("defaults the description to null when it is missing", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await createCompetition(repo, admin, { ...createInput, description: "" });

    expect(vi.mocked(repo.createCompetition).mock.calls[0][0].description).toBeNull();
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

  it("lets the description be edited even when locked by registrations", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord), countRegistrations: vi.fn().mockResolvedValue(3) });
    await updateCompetition(repo, admin, "comp-9", { description: "برنامه روز مسابقه به روز شد" });

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { description: "برنامه روز مسابقه به روز شد" });
  });

  it("still blocks a mixed edit with the description once registrations exist", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord), countRegistrations: vi.fn().mockResolvedValue(3) });
    const failure = await failureOf(updateCompetition(repo, admin, "comp-9", { description: "نکته", title: "عنوان تازه" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });

  it("clears the description when an empty string is sent", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await updateCompetition(repo, admin, "comp-9", { description: "" });

    expect(repo.updateCompetition).toHaveBeenCalledWith("comp-9", { description: null });
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
  it("publishes a valid draft by freezing the rules snapshot", async () => {
    const publishedWithSnapshot = rowWith({
      status: "PUBLISHED",
      rules: {
        ageCategory: {
          id: "senior",
          code: "senior",
          label: "بزرگسال",
          startDate: "1990-01-01T00:00:00.000Z",
          endDate: "2005-12-31T00:00:00.000Z",
        },
        minBelt: { id: "belt-blue", code: "blue", label: "آبی", level: 4 },
        maxBelt: { id: "belt-red", code: "red", label: "قرمز", level: 5 },
        weightClasses: [],
      },
    });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      publishWithRulesSnapshot: vi.fn().mockResolvedValue(publishedWithSnapshot),
    });
    const result = await publishCompetition(repo, admin, "comp-9");

    expect(repo.publishWithRulesSnapshot).toHaveBeenCalledWith("comp-9");
    expect(repo.updateCompetition).not.toHaveBeenCalled();
    expect(result.status).toBe("PUBLISHED");
    expect(result.rules?.minBelt.level).toBe(4);
    expect(result.ageCategoryLabel).toBe("بزرگسال");
  });

  it("reports a conflict when the snapshot publish finds no draft row", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      publishWithRulesSnapshot: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(publishCompetition(repo, admin, "comp-9"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("rejects publishing an already published competition with 409", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(publishedOpenRow),
    });
    const failure = await failureOf(publishCompetition(repo, admin, "comp-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.publishWithRulesSnapshot).not.toHaveBeenCalled();
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
    expect(repo.publishWithRulesSnapshot).not.toHaveBeenCalled();
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

describe("SUPER_ADMIN", () => {
  const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
  const superAdminRecord: UserIdentityRecord = {
    id: "super-1",
    role: "SUPER_ADMIN",
    gender: null,
    province: null,
    isActive: true,
    countyId: null,
  };

  it("lists competitions of every province without county scoping", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(superAdminRecord),
      findCompetitions: vi.fn().mockResolvedValue([farsRow]),
    });
    const result = await listCompetitions(repo, superAdmin, {});

    expect(repo.findCompetitions).toHaveBeenCalledWith(
      { province: undefined, status: undefined, discipline: undefined, search: undefined },
      0,
      100,
      "createdAtDesc",
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.eligibleStudentCount).toBeUndefined();
  });

  it("filters the list by the province query", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    await listCompetitions(repo, superAdmin, { province: "FARS" });

    expect(repo.findCompetitions).toHaveBeenCalledWith(
      { province: "FARS", status: undefined, discipline: undefined, search: undefined },
      0,
      100,
      "createdAtDesc",
    );
  });

  it("sees details of every competition of every province", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(superAdminRecord),
      findCompetitionById: vi.fn().mockResolvedValue(farsRow),
    });
    const result = await getCompetition(repo, superAdmin, "comp-2");

    expect(result.id).toBe("comp-2");
  });

  it("keeps decision actions out of reach", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord) });
    const future = new Date(Date.now() + 3 * DAY_MS);

    await expect(
      failureOf(
        createCompetition(repo, superAdmin, {
          title: "مسابقه آزمایشی",
          discipline: "KYORUGI",
          gender: "MALE",
          ageCategoryId: "senior",
          beltIds: ["belt-blue"],
          level: "PROVINCIAL",
          feePerStudent: "1000000",
          payeeCardNumber: "6037991111111111",
          payeeCardHolder: "مدیر سامانه",
          registrationDeadline: future.toISOString(),
          eventDate: new Date(future.getTime() + DAY_MS).toISOString(),
        }),
      ),
    ).resolves.toMatchObject({ status: 403, code: "FORBIDDEN" });

    await expect(failureOf(updateCompetition(repo, superAdmin, "comp-1", { title: "تغییر" }))).resolves.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(repo.createCompetition).not.toHaveBeenCalled();
    expect(repo.updateCompetition).not.toHaveBeenCalled();
  });
});
