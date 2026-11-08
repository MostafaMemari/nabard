import { describe, expect, it, vi } from "vitest";
import type { AuditEntry, AuditRepository } from "@/features/audit";
import type { CompetitionRulesSnapshot } from "@/features/competitions";
import type { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import { getEventDay, setRegistrationCheckIn, weighInRegistration } from "./event-day";
import type { EventDayRegistrationDetailRow, EventDayRegistrationRow, RegistrationRepository } from "./repository";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };
const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };

const adminRecord = { id: "admin-1", role: "ADMIN" as const, province: "TEHRAN" as const, isActive: true, countyId: null };
const coachRecord = {
  id: "coach-1",
  role: "COACH" as const,
  province: "TEHRAN" as const,
  isActive: true,
  countyId: "county-1",
  gender: "MALE" as const,
};
const superRecord = { id: "super-1", role: "SUPER_ADMIN" as const, province: null, isActive: true, countyId: null };

const rules: CompetitionRulesSnapshot = {
  ageCategory: { id: "cadet", code: "cadet", label: "نوجوان", startDate: "2012-01-01T00:00:00.000Z", endDate: "2014-12-31T00:00:00.000Z" },
  minBelt: { id: "b-yellow", code: "yellow", label: "زرد", level: 2 },
  maxBelt: { id: "b-blue", code: "blue", label: "آبی", level: 4 },
  weightClasses: [
    { id: "wc-light", label: "-33", min: 30, max: 33, excludeMin: false, excludeMax: true, order: 1 },
    { id: "wc-middle", label: "-37", min: 33, max: 37, excludeMin: false, excludeMax: true, order: 2 },
    { id: "wc-heavy", label: "+37", min: 37, max: null, excludeMin: false, excludeMax: false, order: 3 },
  ],
};

const competition = {
  id: "comp-1",
  title: "مسابقه قهرمانی استان",
  province: "TEHRAN" as const,
  level: "PROVINCIAL" as const,
  countyIds: [] as string[],
  status: "PUBLISHED" as const,
  discipline: "KYORUGI" as const,
  gender: "MALE" as const,
  ageCategoryId: "cadet",
  minBeltId: "b-yellow",
  maxBeltId: "b-blue",
  rules,
  feePerStudent: BigInt(2500000),
  registrationDeadline: new Date("2026-11-01T00:00:00.000Z"),
  eventDate: new Date("2026-11-10T00:00:00.000Z"),
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
};

function row(overrides: Partial<EventDayRegistrationRow> = {}): EventDayRegistrationRow {
  return {
    id: "reg-1",
    student: { id: "student-1", fullName: "علی محمدی", nationalCode: "1234567890" },
    coachName: "رضا کریمی",
    beltLabel: "سبز",
    weightClassId: "wc-middle",
    weightClassLabel: "-37",
    weightClassOrder: 2,
    status: "APPROVED",
    checkInAt: null,
    checkInByName: null,
    weighInKg: null,
    weighInAt: null,
    weighInByName: null,
    weighInVerdict: null,
    ...overrides,
  };
}

const detail: EventDayRegistrationDetailRow = {
  id: "reg-1",
  status: "APPROVED",
  weightClassId: "wc-middle",
  weightClassLabel: "-37",
  coachProvince: "TEHRAN",
  competition: { id: "comp-1", status: "PUBLISHED", discipline: "KYORUGI", rules },
};

function auditWith(entries: AuditEntry[] = []): AuditRepository {
  return {
    createAuditLog: vi.fn().mockImplementation(async (entry: AuditEntry) => {
      entries.push(entry);
    }),
  };
}

function repoWith(overrides: Partial<RegistrationRepository> = {}): RegistrationRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(adminRecord),
    findCompetitionById: vi.fn().mockResolvedValue(competition),
    findEventDayRows: vi.fn().mockResolvedValue([row()]),
    findEventDayRegistrationById: vi.fn().mockResolvedValue(detail),
    updateRegistrationWeighIn: vi.fn().mockResolvedValue(true),
    updateRegistrationCheckIn: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as unknown as RegistrationRepository;
}

async function errorOf(run: () => Promise<unknown>): Promise<AppError> {
  try {
    await run();
  } catch (caught) {
    return caught as AppError;
  }

  throw new Error("expected the call to throw");
}

describe("getEventDay", () => {
  it("returns the competition, rows and computed summary for the owning admin", async () => {
    const repo = repoWith({
      findEventDayRows: vi.fn().mockResolvedValue([
        row(),
        row({
          id: "reg-2",
          weightClassId: "wc-heavy",
          weightClassLabel: "+37",
          weightClassOrder: 3,
          weighInKg: 42,
          weighInAt: new Date("2026-11-10T08:30:00.000Z"),
          weighInVerdict: "MOVED",
          checkInAt: new Date("2026-11-10T08:00:00.000Z"),
        }),
      ]),
    });

    const result = await getEventDay(repo, admin, "comp-1");

    expect(result.competition.id).toBe("comp-1");
    expect(result.competition.title).toBe("مسابقه قهرمانی استان");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.weighInAt).toBe(null);
    expect(result.summary).toEqual({ approved: 2, checkedIn: 1, weighed: 1, match: 0, moved: 1, outOfWeight: 0 });
  });

  it("hides competitions of other provinces from an admin", async () => {
    const otherProvince = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, province: "FARS" }) });
    const error = await errorOf(() => getEventDay(otherProvince, admin, "comp-1"));

    expect(error.status).toBe(404);
  });

  it("forbids coaches and allows the super admin to read", async () => {
    const coachError = await errorOf(() =>
      getEventDay(repoWith({ findUserById: vi.fn().mockResolvedValue(coachRecord) }), coach, "comp-1"),
    );
    expect(coachError.status).toBe(403);

    const result = await getEventDay(repoWith({ findUserById: vi.fn().mockResolvedValue(superRecord) }), superAdmin, "comp-1");
    expect(result.competition.id).toBe("comp-1");
  });
});

describe("weighInRegistration", () => {
  it("records a matching weight without touching the weight class", async () => {
    const repo = repoWith();
    const audit = auditWith();

    const patch = await weighInRegistration(repo, audit, admin, "reg-1", 35);

    expect(patch).toMatchObject({
      id: "reg-1",
      weightClassId: "wc-middle",
      weightClassLabel: "-37",
      weighInKg: 35,
      weighInVerdict: "MATCH",
    });
    expect(repo.updateRegistrationWeighIn).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ weightKg: 35, verdict: "MATCH", movedTo: null }),
    );
    expect(audit.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "registration.weighed", entityId: "reg-1" }));
  });

  it("moves the athlete and rewrites the weight class snapshot when the weight belongs to another class", async () => {
    const repo = repoWith();
    const audit = auditWith();

    const patch = await weighInRegistration(repo, audit, admin, "reg-1", 40);

    expect(patch).toMatchObject({ weightClassId: "wc-heavy", weightClassLabel: "+37", weighInVerdict: "MOVED" });
    expect(repo.updateRegistrationWeighIn).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ verdict: "MOVED", movedTo: { id: "wc-heavy", label: "+37", min: 37, max: null } }),
    );
    expect(audit.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ details: expect.objectContaining({ from: "-37", to: "+37", verdict: "MOVED" }) }),
    );
  });

  it("marks an athlete outside every class as out of weight", async () => {
    const repo = repoWith();

    const patch = await weighInRegistration(repo, auditWith(), admin, "reg-1", 20);

    expect(patch).toMatchObject({ weighInVerdict: "OUT_OF_WEIGHT", weightClassId: "wc-middle" });
    expect(repo.updateRegistrationWeighIn).toHaveBeenCalledWith(
      "reg-1",
      expect.objectContaining({ verdict: "OUT_OF_WEIGHT", movedTo: null }),
    );
  });

  it("rejects poomsae registrations, pending registrations and other provinces", async () => {
    const poomsae = await errorOf(() =>
      weighInRegistration(
        repoWith({
          findEventDayRegistrationById: vi
            .fn()
            .mockResolvedValue({ ...detail, competition: { ...detail.competition, discipline: "POOMSAE" } }),
        }),
        auditWith(),
        admin,
        "reg-1",
        35,
      ),
    );
    expect(poomsae.status).toBe(409);

    const pending = await errorOf(() =>
      weighInRegistration(
        repoWith({ findEventDayRegistrationById: vi.fn().mockResolvedValue({ ...detail, status: "PENDING" }) }),
        auditWith(),
        admin,
        "reg-1",
        35,
      ),
    );
    expect(pending.status).toBe(409);

    const otherProvince = await errorOf(() =>
      weighInRegistration(
        repoWith({ findEventDayRegistrationById: vi.fn().mockResolvedValue({ ...detail, coachProvince: "FARS" }) }),
        auditWith(),
        admin,
        "reg-1",
        35,
      ),
    );
    expect(otherProvince.status).toBe(404);
  });

  it("rejects a concurrent loss of the approved state with a conflict", async () => {
    const error = await errorOf(() =>
      weighInRegistration(repoWith({ updateRegistrationWeighIn: vi.fn().mockResolvedValue(false) }), auditWith(), admin, "reg-1", 35),
    );

    expect(error.status).toBe(409);
  });

  it("allows only admins to weigh athletes", async () => {
    const coachError = await errorOf(() =>
      weighInRegistration(repoWith({ findUserById: vi.fn().mockResolvedValue(coachRecord) }), auditWith(), coach, "reg-1", 35),
    );
    expect(coachError.status).toBe(403);

    const superError = await errorOf(() =>
      weighInRegistration(repoWith({ findUserById: vi.fn().mockResolvedValue(superRecord) }), auditWith(), superAdmin, "reg-1", 35),
    );
    expect(superError.status).toBe(403);
  });
});

describe("setRegistrationCheckIn", () => {
  it("records and removes attendance", async () => {
    const repo = repoWith();

    const checked = await setRegistrationCheckIn(repo, admin, "reg-1", true);
    expect(checked.id).toBe("reg-1");
    expect(checked.checkInAt).not.toBeNull();
    expect(repo.updateRegistrationCheckIn).toHaveBeenCalledWith("reg-1", true, "admin-1");

    const unchecked = await setRegistrationCheckIn(repo, admin, "reg-1", false);
    expect(unchecked.checkInAt).toBeNull();
    expect(repo.updateRegistrationCheckIn).toHaveBeenCalledWith("reg-1", false, "admin-1");
  });

  it("refuses a canceled competition", async () => {
    const canceled = repoWith({
      findEventDayRegistrationById: vi.fn().mockResolvedValue({ ...detail, competition: { ...detail.competition, status: "CANCELED" } }),
    });
    const error = await errorOf(() => setRegistrationCheckIn(canceled, admin, "reg-1", true));

    expect(error.status).toBe(409);
  });
});
