import { describe, expect, it, vi } from "vitest";
import type { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { CountyChangeRequestWithScope, CountyChangesRepository, UserIdentityRecord } from "./repository";
import { createCountyChange, decideCountyChange, getMyCountyChange, listCountyChanges } from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true, countyId: null };
const coachRecord: UserIdentityRecord = {
  id: "coach-1",
  role: "COACH",
  province: "TEHRAN",
  isActive: true,
  countyId: "county-tehran",
};

const tehranCounty = { id: "county-tehran", province: "TEHRAN" as const, name: "تهران" };
const rayCounty = { id: "county-ray", province: "TEHRAN" as const, name: "ری" };
const shirazCounty = { id: "county-shiraz", province: "FARS" as const, name: "شیراز" };

const createdAt = new Date("2026-10-28T09:40:00.000Z");

function requestRow(overrides: Partial<CountyChangeRequestWithScope> = {}): CountyChangeRequestWithScope {
  return {
    id: "ccr-1",
    coachId: "coach-1",
    coachName: "رضا محمدی",
    fromCountyId: "county-tehran",
    fromCountyName: "تهران",
    toCountyId: "county-ray",
    toCountyName: "ری",
    status: "PENDING",
    note: null,
    decidedAt: null,
    createdAt,
    coachProvince: "TEHRAN",
    ...overrides,
  };
}

function repoWith(overrides: Partial<CountyChangesRepository> = {}): CountyChangesRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    findCountyById: vi
      .fn()
      .mockImplementation(async (id: string) =>
        id === tehranCounty.id ? tehranCounty : id === rayCounty.id ? rayCounty : id === shirazCounty.id ? shirazCounty : null,
      ),
    findLatestRequestByCoachId: vi.fn().mockResolvedValue(null),
    findPendingRequestByCoachId: vi.fn().mockResolvedValue(null),
    createCountyChange: vi.fn().mockResolvedValue(requestRow()),
    countCountyChanges: vi.fn().mockResolvedValue(1),
    findCountyChanges: vi.fn().mockResolvedValue([requestRow()]),
    findCountyChangeById: vi.fn().mockResolvedValue(requestRow()),
    decideCountyChangeFromPending: vi.fn().mockResolvedValue(requestRow()),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("createCountyChange", () => {
  it("creates a PENDING request from the coach current county", async () => {
    const repo = repoWith();
    const result = await createCountyChange(repo, coach, { toCountyId: "county-ray" });

    expect(repo.createCountyChange).toHaveBeenCalledWith({
      coachId: "coach-1",
      fromCountyId: "county-tehran",
      toCountyId: "county-ray",
    });
    expect(result).toMatchObject({ id: "ccr-1", status: "PENDING", fromCountyName: "تهران", toCountyName: "ری" });
    expect(result.createdAt).toBe(createdAt.toISOString());
  });

  it("rejects a second request while one is pending with 409", async () => {
    const repo = repoWith({ findPendingRequestByCoachId: vi.fn().mockResolvedValue(requestRow()) });
    const failure = await failureOf(createCountyChange(repo, coach, { toCountyId: "county-ray" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createCountyChange).not.toHaveBeenCalled();
  });

  it("rejects the same county as the current one with 400", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCountyChange(repo, coach, { toCountyId: "county-tehran" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createCountyChange).not.toHaveBeenCalled();
  });

  it("rejects a county of another province with 400", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCountyChange(repo, coach, { toCountyId: "county-shiraz" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createCountyChange).not.toHaveBeenCalled();
  });

  it("rejects an unknown county with 400", async () => {
    const repo = repoWith({ findCountyById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(createCountyChange(repo, coach, { toCountyId: "county-nope" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("rejects a coach without a county with 409", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...coachRecord, countyId: null }) });
    const failure = await failureOf(createCountyChange(repo, coach, { toCountyId: "county-ray" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(createCountyChange(repo, admin, { toCountyId: "county-ray" }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("getMyCountyChange", () => {
  it("returns the latest request of the coach with ISO dates", async () => {
    const decided = requestRow({ status: "REJECTED", note: "دلیل", decidedAt: createdAt });
    const repo = repoWith({ findLatestRequestByCoachId: vi.fn().mockResolvedValue(decided) });
    const result = await getMyCountyChange(repo, coach);

    expect(result).toMatchObject({ id: "ccr-1", status: "REJECTED", note: "دلیل" });
    expect(result?.decidedAt).toBe(createdAt.toISOString());
  });

  it("returns null when the coach has no requests", async () => {
    const repo = repoWith();
    const result = await getMyCountyChange(repo, coach);

    expect(result).toBeNull();
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(getMyCountyChange(repo, admin));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("listCountyChanges", () => {
  it("scopes the admin list to its province with the status filter", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await listCountyChanges(repo, admin, { status: "PENDING" });

    expect(repo.countCountyChanges).toHaveBeenCalledWith({ province: "TEHRAN", status: "PENDING" });
    expect(repo.findCountyChanges).toHaveBeenCalledWith({ province: "TEHRAN", status: "PENDING" }, 0, 100);
    expect(result).toMatchObject({ meta: { page: 1, pageSize: 100, total: 1 } });
    expect(result.data[0]).not.toHaveProperty("coachProvince");
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(listCountyChanges(repo, coach, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findCountyChanges).not.toHaveBeenCalled();
  });
});

describe("decideCountyChange", () => {
  it("approves inside a transaction and clears the note", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const result = await decideCountyChange(repo, admin, "ccr-1", "APPROVED", null);

    expect(repo.decideCountyChangeFromPending).toHaveBeenCalledWith("ccr-1", {
      status: "APPROVED",
      note: null,
      decidedById: "admin-1",
    });
    expect(result).toMatchObject({ id: "ccr-1", status: "PENDING" });
  });

  it("stores the note when rejecting", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await decideCountyChange(repo, admin, "ccr-1", "REJECTED", "تغییر شهرستان ممکن نیست.");

    expect(repo.decideCountyChangeFromPending).toHaveBeenCalledWith("ccr-1", {
      status: "REJECTED",
      note: "تغییر شهرستان ممکن نیست.",
      decidedById: "admin-1",
    });
  });

  it("rejects a second decision with 409", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      decideCountyChangeFromPending: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(decideCountyChange(repo, admin, "ccr-1", "APPROVED", null));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلا بررسی شده");
  });

  it("hides a request of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findCountyChangeById: vi.fn().mockResolvedValue(requestRow({ coachProvince: "FARS" })),
    });
    const failure = await failureOf(decideCountyChange(repo, admin, "ccr-1", "APPROVED", null));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.decideCountyChangeFromPending).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(decideCountyChange(repo, coach, "ccr-1", "APPROVED", null));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});
