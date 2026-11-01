import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { ProvinceSummary } from "../types";
import type { SuperRepository, UserIdentityRecord } from "./repository";
import { getSuperSummary } from "./service";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };

const superAdminRecord: UserIdentityRecord = { id: "super-1", role: "SUPER_ADMIN", province: null, isActive: true };

const summaries: ProvinceSummary[] = [
  { province: "TEHRAN", admins: 2, coaches: 30, students: 220, competitions: 5, registrations: 180, pendingPayments: 3 },
  { province: "FARS", admins: 1, coaches: 8, students: 40, competitions: 1, registrations: 12, pendingPayments: 0 },
];

function repoWith(overrides: Partial<SuperRepository> = {}): SuperRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(superAdminRecord),
    findProvinceSummaries: vi.fn().mockResolvedValue(summaries),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("getSuperSummary", () => {
  it("returns per province counts for a super admin", async () => {
    const repo = repoWith();
    const result = await getSuperSummary(repo, superAdmin);

    expect(repo.findProvinceSummaries).toHaveBeenCalledTimes(1);
    expect(result).toEqual(summaries);
  });

  it("rejects an ADMIN with 403 without querying", async () => {
    const repo = repoWith();
    const failure = await failureOf(getSuperSummary(repo, admin));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findProvinceSummaries).not.toHaveBeenCalled();
  });

  it("rejects when the super admin row is gone with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(getSuperSummary(repo, superAdmin));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("rejects an inactive super admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...superAdminRecord, isActive: false }) });
    const failure = await failureOf(getSuperSummary(repo, superAdmin));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});
