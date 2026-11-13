import { describe, expect, it, vi } from "vitest";
import type { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { RefundsRepository, RefundWithScope } from "./repository";
import { completeRefund, listRefunds } from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const coachRecord = { id: "coach-1", role: "COACH" as const, province: "TEHRAN" as const, isActive: true };
const adminRecord = { id: "admin-1", role: "ADMIN" as const, province: "TEHRAN" as const, isActive: true };

const createdAt = new Date("2026-10-20T09:00:00.000Z");

const refundRow: RefundWithScope = {
  id: "refund-1",
  registrationId: "reg-1",
  coachId: "coach-1",
  coachName: "رضا کریمی",
  studentName: "علی محمدی",
  competitionId: "comp-1",
  competitionTitle: "مسابقات قهرمانی استان",
  amount: "2500000",
  reason: "REGISTRATION_REJECTED",
  status: "PENDING",
  note: null,
  processedAt: null,
  createdAt,
  coachProvince: "TEHRAN",
};

function repoWith(overrides: Partial<RefundsRepository> = {}): RefundsRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    countRefunds: vi.fn().mockResolvedValue(1),
    findRefunds: vi.fn().mockResolvedValue([refundRow]),
    findRefundById: vi.fn().mockResolvedValue(refundRow),
    completeRefundFromPending: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("listRefunds", () => {
  it("forces a coach to its own refunds", async () => {
    const repo = repoWith();
    await listRefunds(repo, coach, { status: "PENDING" });

    expect(repo.findRefunds).toHaveBeenCalledWith({ coachId: "coach-1", status: "PENDING" }, 0, 100);
    expect(repo.countRefunds).toHaveBeenCalledWith({ coachId: "coach-1", status: "PENDING" });
  });

  it("scopes an admin to its province with the status filter and pagination", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listRefunds(repo, admin, { status: "COMPLETED", page: 2, pageSize: 20 });

    expect(repo.findRefunds).toHaveBeenCalledWith({ province: "TEHRAN", status: "COMPLETED" }, 20, 20);
    expect(repo.countRefunds).toHaveBeenCalledWith({ province: "TEHRAN", status: "COMPLETED" });
  });
});

describe("completeRefund", () => {
  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(completeRefund(repo, coach, "refund-1", { note: null }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.completeRefundFromPending).not.toHaveBeenCalled();
  });

  it("hides refunds of another province from the admin with 404", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, province: "FARS" }) });
    const failure = await failureOf(completeRefund(repo, admin, "refund-1", { note: null }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.completeRefundFromPending).not.toHaveBeenCalled();
  });

  it("completes a pending refund with the admin id, processed time and note", async () => {
    const completed: RefundWithScope = {
      ...refundRow,
      status: "COMPLETED",
      note: "حواله شد",
      processedAt: new Date("2026-10-21T10:00:00.000Z"),
    };
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      completeRefundFromPending: vi.fn().mockResolvedValue(completed),
    });
    const record = await completeRefund(repo, admin, "refund-1", { note: "حواله شد" });

    expect(repo.completeRefundFromPending).toHaveBeenCalledWith("refund-1", { processedById: "admin-1", note: "حواله شد" });
    expect(record.status).toBe("COMPLETED");
    expect(record.note).toBe("حواله شد");
  });

  it("blocks a second completion with a Persian conflict", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      completeRefundFromPending: vi.fn().mockResolvedValue(null),
    });
    const failure = await failureOf(completeRefund(repo, admin, "refund-1", { note: null }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلا ثبت شده");
  });

  it("applies the completion only once when two requests race", async () => {
    let row: RefundWithScope = { ...refundRow };
    const complete = vi.fn().mockImplementation(async (_id: string, input: { processedById: string; note: string | null }) => {
      if (row.status !== "PENDING") return null;
      row = { ...row, status: "COMPLETED", processedAt: new Date(), note: input.note };

      return row;
    });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findRefundById: vi.fn().mockImplementation(async () => row),
      completeRefundFromPending: complete,
    });

    const [first, second] = await Promise.all([
      completeRefund(repo, admin, "refund-1", { note: null }),
      completeRefund(repo, admin, "refund-1", { note: null }).catch((error: unknown) => error),
    ]);

    expect(first).toMatchObject({ status: "COMPLETED" });
    expect(second).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(complete).toHaveBeenCalledTimes(2);
  });
});
