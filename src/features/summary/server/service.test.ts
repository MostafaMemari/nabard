import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/session";
import type { SummaryRepository } from "./repository";
import { getAdminSummary } from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const adminRecord = { id: "admin-1", role: "ADMIN" as const, province: "TEHRAN" as const, isActive: true };

function repoWith(overrides: Partial<SummaryRepository> = {}): SummaryRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(adminRecord),
    countPayments: vi.fn().mockResolvedValue(3),
    countOpenCompetitions: vi.fn().mockResolvedValue(2),
    countRegistrationsSince: vi.fn().mockResolvedValue(7),
    findLatestPendingPayments: vi
      .fn()
      .mockResolvedValue([
        { id: "pay-1", amount: "5000000", createdAt: "2026-11-01T09:00:00.000Z", coachId: "coach-1", coachName: "سعید احمدی" },
      ]),
    findUpcomingCompetitions: vi.fn().mockResolvedValue([
      {
        id: "comp-1",
        title: "مسابقات قهرمانی استان تهران",
        discipline: "KYORUGI" as const,
        registrationDeadline: "2026-11-20T20:30:00.000Z",
        registrationsCount: 12,
      },
    ]),
    ...overrides,
  };
}

describe("getAdminSummary", () => {
  it("rejects a coach with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, role: "COACH" }) });
    const failure = await getAdminSummary(repo, coach).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.countPayments).not.toHaveBeenCalled();
  });

  it("scopes every count and list to the admin province", async () => {
    const repo = repoWith();
    const summary = await getAdminSummary(repo, admin);

    expect(repo.countPayments).toHaveBeenCalledWith("TEHRAN", "PENDING");
    expect(repo.countOpenCompetitions).toHaveBeenCalledWith("TEHRAN");
    expect(repo.countRegistrationsSince).toHaveBeenCalledWith("TEHRAN", expect.any(Date));
    expect(repo.findLatestPendingPayments).toHaveBeenCalledWith("TEHRAN");
    expect(repo.findUpcomingCompetitions).toHaveBeenCalledWith("TEHRAN");
    expect(summary.pendingPaymentsCount).toBe(3);
    expect(summary.latestPendingPayments[0]?.coachName).toBe("سعید احمدی");
    expect(summary.upcomingCompetitions[0]?.registrationsCount).toBe(12);
  });

  it("rejects an inactive admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, isActive: false }) });
    const failure = await getAdminSummary(repo, admin).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});
