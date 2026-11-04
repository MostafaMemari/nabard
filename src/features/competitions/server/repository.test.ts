import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompetitionRow } from "./repository";
import { cancelCompetitionWithRefunds, UNREVIEWED_PAYMENT_REFUND_NOTE } from "./repository";

const { tx, prisma } = vi.hoisted(() => {
  const tx = {
    competition: { updateMany: vi.fn(), findUnique: vi.fn() },
    registration: { findMany: vi.fn() },
    refund: { create: vi.fn() },
  };
  const prisma = { $transaction: (callback: (client: unknown) => unknown) => callback(tx) };
  return { tx, prisma };
});

vi.mock("@/lib/prisma", () => ({ getPrisma: () => prisma }));

const FEE = BigInt("3500000");

const canceledRow: CompetitionRow = {
  id: "comp-1",
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
  feePerStudent: FEE,
  payeeCardNumber: "6104337812345678",
  payeeCardHolder: "فدراسیون تکواندو استان تهران",
  registrationDeadline: new Date("2026-11-10T00:00:00.000Z"),
  eventDate: new Date("2026-11-20T00:00:00.000Z"),
  status: "CANCELED",
  rules: null,
  cancelReason: "دلیل لغو",
  createdAt: new Date("2026-11-01T00:00:00.000Z"),
  updatedAt: new Date("2026-11-02T00:00:00.000Z"),
};

function registrationRow(id: string, coachId: string, paymentStatus: string) {
  return { id, coachId, payment: { status: paymentStatus }, competition: { feePerStudent: FEE } };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("cancelCompetitionWithRefunds", () => {
  it("creates PENDING refunds for confirmed and unreviewed payments in one transaction", async () => {
    tx.competition.updateMany.mockResolvedValue({ count: 1 });
    tx.registration.findMany.mockResolvedValue([
      registrationRow("reg-1", "coach-1", "CONFIRMED"),
      registrationRow("reg-2", "coach-2", "PENDING"),
    ]);
    tx.competition.findUnique.mockResolvedValue({ ...canceledRow, counties: [] });

    const result = await cancelCompetitionWithRefunds("comp-1", "دلیل لغو");

    expect(tx.competition.updateMany).toHaveBeenCalledWith({
      where: { id: "comp-1", status: "PUBLISHED" },
      data: { status: "CANCELED", cancelReason: "دلیل لغو" },
    });
    expect(tx.registration.findMany).toHaveBeenCalledWith({
      where: { competitionId: "comp-1", payment: { status: { in: ["CONFIRMED", "PENDING"] } }, refund: { is: null } },
      select: { id: true, coachId: true, payment: { select: { status: true } }, competition: { select: { feePerStudent: true } } },
    });
    expect(tx.refund.create).toHaveBeenCalledTimes(2);
    expect(tx.refund.create).toHaveBeenNthCalledWith(1, {
      data: {
        registrationId: "reg-1",
        coachId: "coach-1",
        amount: FEE,
        reason: "COMPETITION_CANCELED",
        status: "PENDING",
      },
    });
    expect(tx.refund.create).toHaveBeenNthCalledWith(2, {
      data: {
        registrationId: "reg-2",
        coachId: "coach-2",
        amount: FEE,
        reason: "COMPETITION_CANCELED",
        status: "PENDING",
        note: UNREVIEWED_PAYMENT_REFUND_NOTE,
      },
    });
    expect(result).toEqual(canceledRow);
  });

  it("never duplicates refunds and skips rejected receipts through the query filters", async () => {
    tx.competition.updateMany.mockResolvedValue({ count: 1 });
    tx.registration.findMany.mockResolvedValue([registrationRow("reg-1", "coach-1", "CONFIRMED")]);
    tx.competition.findUnique.mockResolvedValue({ ...canceledRow, counties: [] });

    await cancelCompetitionWithRefunds("comp-1", "دلیل لغو");

    const where = tx.registration.findMany.mock.calls[0][0].where;
    expect(where.refund).toEqual({ is: null });
    expect(where.payment.status.in).toEqual(["CONFIRMED", "PENDING"]);
    expect(where.payment.status.in).not.toContain("REJECTED");
    expect(tx.refund.create).toHaveBeenCalledTimes(1);
  });

  it("applies the cancel and the refunds at most once", async () => {
    tx.competition.updateMany.mockResolvedValue({ count: 0 });

    const result = await cancelCompetitionWithRefunds("comp-1", "دلیل لغو");

    expect(result).toBeNull();
    expect(tx.registration.findMany).not.toHaveBeenCalled();
    expect(tx.refund.create).not.toHaveBeenCalled();
  });
});
