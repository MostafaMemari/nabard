import { beforeEach, describe, expect, it, vi } from "vitest";
import { reassignCoachStudents, StudentOwnerChangedError, type TransferWithScope } from "./repository";

const { tx, prisma } = vi.hoisted(() => {
  const tx = {
    studentTransfer: { updateMany: vi.fn(), findUnique: vi.fn() },
    student: { updateMany: vi.fn() },
  };
  const prisma = { $transaction: (callback: (client: unknown) => unknown) => callback(tx) };
  return { tx, prisma };
});

vi.mock("@/lib/prisma", () => ({ getPrisma: () => prisma }));

const updatedRow = {
  id: "transfer-1",
  status: "APPROVED" as const,
  note: null,
  decidedAt: new Date("2026-11-02T10:00:00.000Z"),
  createdAt: new Date("2026-11-01T10:00:00.000Z"),
  student: { id: "student-1", fullName: "علی رضایی" },
  fromCoach: { id: "coach-1", fullName: "سعید احمدی", province: "TEHRAN" as const },
  toCoach: { id: "coach-2", fullName: "رضا کریمی", province: "TEHRAN" as const },
};

const approvalRow = {
  studentId: "student-1",
  fromCoachId: "coach-1",
  toCoachId: "coach-2",
  student: { gender: "MALE" as const },
  toCoach: { gender: "MALE" as const },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("decideTransferFromPending", () => {
  it("applies the decision once and moves the student in the same transaction", async () => {
    tx.studentTransfer.updateMany.mockResolvedValue({ count: 1 });
    tx.studentTransfer.findUnique.mockResolvedValueOnce(approvalRow).mockResolvedValueOnce(updatedRow);
    tx.student.updateMany.mockResolvedValue({ count: 1 });

    const { decideTransferFromPending } = await import("./repository");
    const result = (await decideTransferFromPending("transfer-1", {
      status: "APPROVED",
      note: null,
      decidedById: "admin-1",
    })) as TransferWithScope;

    expect(tx.studentTransfer.updateMany).toHaveBeenCalledWith({
      where: { id: "transfer-1", status: "PENDING" },
      data: { status: "APPROVED", note: null, decidedById: "admin-1", decidedAt: expect.any(Date) },
    });
    expect(tx.student.updateMany).toHaveBeenCalledWith({
      where: { id: "student-1", coachId: "coach-1" },
      data: { coachId: "coach-2" },
    });
    expect(result.status).toBe("APPROVED");
    expect(result.fromCoachName).toBe("سعید احمدی");
  });

  it("touches only the transfer and the student coach, never registrations", async () => {
    tx.studentTransfer.updateMany.mockResolvedValue({ count: 1 });
    tx.studentTransfer.findUnique.mockResolvedValueOnce(approvalRow).mockResolvedValueOnce(updatedRow);
    tx.student.updateMany.mockResolvedValue({ count: 1 });

    const { decideTransferFromPending } = await import("./repository");
    await decideTransferFromPending("transfer-1", { status: "APPROVED", note: null, decidedById: "admin-1" });

    expect(Object.keys(tx)).toEqual(["studentTransfer", "student"]);
    expect(tx.student.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.studentTransfer.updateMany).toHaveBeenCalledTimes(1);
  });

  it("returns null when the request was already decided", async () => {
    tx.studentTransfer.updateMany.mockResolvedValue({ count: 0 });

    const { decideTransferFromPending } = await import("./repository");
    const result = await decideTransferFromPending("transfer-1", { status: "REJECTED", note: "نه", decidedById: "admin-1" });

    expect(result).toBeNull();
    expect(tx.student.updateMany).not.toHaveBeenCalled();
  });

  it("rolls back when the student is no longer owned by the previous coach", async () => {
    tx.studentTransfer.updateMany.mockResolvedValue({ count: 1 });
    tx.studentTransfer.findUnique.mockResolvedValueOnce(approvalRow);
    tx.student.updateMany.mockResolvedValue({ count: 0 });

    const { decideTransferFromPending } = await import("./repository");
    const failure = await decideTransferFromPending("transfer-1", { status: "APPROVED", note: null, decidedById: "admin-1" }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(StudentOwnerChangedError);
    expect(tx.studentTransfer.findUnique).toHaveBeenCalled();
  });

  it("rolls back when the student gender no longer matches the receiving coach", async () => {
    tx.studentTransfer.updateMany.mockResolvedValue({ count: 1 });
    tx.studentTransfer.findUnique
      .mockResolvedValueOnce({ ...approvalRow, student: { gender: "FEMALE" as const } })
      .mockResolvedValueOnce(updatedRow);

    const { decideTransferFromPending, TransferGenderMismatchError } = await import("./repository");
    const failure = await decideTransferFromPending("transfer-1", { status: "APPROVED", note: null, decidedById: "admin-1" }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(TransferGenderMismatchError);
    expect(tx.student.updateMany).not.toHaveBeenCalled();
  });

  it("rolls back when the receiving coach has no gender on record", async () => {
    tx.studentTransfer.updateMany.mockResolvedValue({ count: 1 });
    tx.studentTransfer.findUnique.mockResolvedValueOnce({ ...approvalRow, toCoach: { gender: null } }).mockResolvedValueOnce(updatedRow);

    const { decideTransferFromPending, TransferGenderMismatchError } = await import("./repository");
    const failure = await decideTransferFromPending("transfer-1", { status: "APPROVED", note: null, decidedById: "admin-1" }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(TransferGenderMismatchError);
    expect(tx.student.updateMany).not.toHaveBeenCalled();
  });
});

describe("reassignCoachStudents", () => {
  it("moves all students of the coach in one update and returns the count", async () => {
    tx.student.updateMany.mockResolvedValue({ count: 7 });

    const moved = await reassignCoachStudents("coach-1", "coach-2");

    expect(tx.student.updateMany).toHaveBeenCalledWith({
      where: { coachId: "coach-1" },
      data: { coachId: "coach-2" },
    });
    expect(moved).toBe(7);
  });
});
