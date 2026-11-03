import { describe, expect, it, vi } from "vitest";
import type { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type { PaymentsRepository, PaymentTransitionInput, PaymentWithScope } from "./repository";
import { confirmPayment, getPayment, listPayments, readReceipt, rejectPayment, uploadReceipt } from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const coachRecord = { id: "coach-1", role: "COACH" as const, province: "TEHRAN" as const, isActive: true };
const adminRecord = { id: "admin-1", role: "ADMIN" as const, province: "TEHRAN" as const, isActive: true };

const createdAt = new Date("2026-10-20T09:00:00.000Z");

const paymentRow: PaymentWithScope = {
  id: "pay-1",
  competitionId: "comp-1",
  coachId: "coach-1",
  amount: "5000000",
  receiptKey: "file-1",
  status: "PENDING",
  note: null,
  createdAt,
  updatedAt: createdAt,
  coachProvince: "TEHRAN",
  competitionDeadline: new Date("2026-11-20T20:30:00.000Z"),
};

const rejectedPayment: PaymentWithScope = { ...paymentRow, id: "pay-8", status: "REJECTED", note: "رسید ناخوانا است." };

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

function receiptFile(bytes: Uint8Array<ArrayBuffer> = PNG_BYTES): File {
  return new File([bytes], "receipt.png", { type: "image/png" });
}

function repoWith(overrides: Partial<PaymentsRepository> = {}): PaymentsRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(coachRecord),
    countPayments: vi.fn().mockResolvedValue(1),
    findPayments: vi.fn().mockResolvedValue([paymentRow]),
    findPaymentById: vi.fn().mockResolvedValue(paymentRow),
    updatePayment: vi.fn().mockResolvedValue(paymentRow),
    transitionPaymentFromPending: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function storageWith(overrides: Partial<Storage> = {}): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "file-2", mime: "image/png", size: PNG_BYTES.byteLength }),
    get: vi.fn().mockResolvedValue({ mime: "image/png", size: PNG_BYTES.byteLength, stream: new Blob([PNG_BYTES]).stream() }),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrls: vi.fn().mockResolvedValue(new Map()),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("listPayments", () => {
  it("forces a coach to its own payments and ignores the coachId param", async () => {
    const repo = repoWith();
    await listPayments(repo, coach, { coachId: "coach-2", status: "PENDING" });

    expect(repo.findPayments).toHaveBeenCalledWith({ coachId: "coach-1", status: "PENDING", competitionId: undefined }, 0, 100);
    expect(repo.countPayments).toHaveBeenCalledWith({ coachId: "coach-1", status: "PENDING", competitionId: undefined });
  });

  it("scopes an admin to its province and keeps the coachId filter", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    await listPayments(repo, admin, { coachId: "coach-2" });

    expect(repo.findPayments).toHaveBeenCalledWith(
      { province: "TEHRAN", coachId: "coach-2", status: undefined, competitionId: undefined },
      0,
      100,
    );
  });
});

describe("getPayment", () => {
  it("returns an own payment to the coach", async () => {
    const repo = repoWith();
    const record = await getPayment(repo, coach, "pay-1");

    expect(record.amount).toBe("5000000");
    expect(record.receiptKey).toBe("file-1");
  });

  it("hides another coach payment from a coach with 404", async () => {
    const repo = repoWith({ findPaymentById: vi.fn().mockResolvedValue({ ...paymentRow, coachId: "coach-2" }) });
    const failure = await failureOf(getPayment(repo, coach, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns a province payment to the admin and hides other provinces", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const record = await getPayment(repo, admin, "pay-1");
    expect(record.id).toBe("pay-1");

    const otherProvince = repoWith({
      findUserById: vi.fn().mockResolvedValue({ ...adminRecord, province: "FARS" }),
    });
    const failure = await failureOf(getPayment(otherProvince, { id: "admin-1", role: "ADMIN" }, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("confirmPayment", () => {
  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(confirmPayment(repo, coach, "pay-1"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.transitionPaymentFromPending).not.toHaveBeenCalled();
  });

  it("hides payments of another province from the admin with 404", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, province: "FARS" }) });
    const failure = await failureOf(confirmPayment(repo, admin, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.transitionPaymentFromPending).not.toHaveBeenCalled();
  });

  it("confirms a pending payment inside a conditional transaction and clears the note", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionPaymentFromPending: vi.fn().mockResolvedValue({ ...paymentRow, status: "CONFIRMED", note: null }),
    });
    const record = await confirmPayment(repo, admin, "pay-1");

    expect(repo.transitionPaymentFromPending).toHaveBeenCalledWith("pay-1", { status: "CONFIRMED", note: null });
    expect(record.status).toBe("CONFIRMED");
    expect(record.note).toBeNull();
  });

  it("blocks confirming a confirmed payment with a Persian conflict", async () => {
    const confirmed = { ...paymentRow, status: "CONFIRMED" as const };
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionPaymentFromPending: vi.fn().mockResolvedValue(null),
      findPaymentById: vi.fn().mockResolvedValue(confirmed),
    });
    const failure = await failureOf(confirmPayment(repo, admin, "pay-1"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلا تأیید شده");
  });

  it("blocks confirming a rejected payment until a new receipt arrives", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionPaymentFromPending: vi.fn().mockResolvedValue(null),
      findPaymentById: vi.fn().mockResolvedValue(rejectedPayment),
    });
    const failure = await failureOf(confirmPayment(repo, admin, "pay-8"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("رسید جدید");
  });
});

describe("rejectPayment", () => {
  it("rejects a pending payment with the given note", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionPaymentFromPending: vi.fn().mockResolvedValue(rejectedPayment),
    });
    const record = await rejectPayment(repo, admin, "pay-8", "رسید ناخوانا است.");

    expect(repo.transitionPaymentFromPending).toHaveBeenCalledWith("pay-8", { status: "REJECTED", note: "رسید ناخوانا است." });
    expect(record.status).toBe("REJECTED");
    expect(record.note).toBe("رسید ناخوانا است.");
  });

  it("blocks rejecting a confirmed payment", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionPaymentFromPending: vi.fn().mockResolvedValue(null),
      findPaymentById: vi.fn().mockResolvedValue({ ...paymentRow, status: "CONFIRMED" }),
    });
    const failure = await failureOf(rejectPayment(repo, admin, "pay-1", "ناسازگار"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قابل رد کردن نیست");
  });

  it("blocks rejecting a rejected payment again", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      transitionPaymentFromPending: vi.fn().mockResolvedValue(null),
      findPaymentById: vi.fn().mockResolvedValue(rejectedPayment),
    });
    const failure = await failureOf(rejectPayment(repo, admin, "pay-8", "ناسازگار"));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("قبلا رد شده");
  });

  it("applies the transition only once when two requests race", async () => {
    let row: PaymentWithScope = { ...paymentRow };
    const transition = vi.fn().mockImplementation(async (_id: string, input: PaymentTransitionInput) => {
      if (row.status !== "PENDING") return null;
      row = { ...row, status: input.status, note: input.note };
      return row;
    });
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(adminRecord),
      findPaymentById: vi.fn().mockImplementation(async () => row),
      transitionPaymentFromPending: transition,
    });

    const [first, second] = await Promise.all([
      confirmPayment(repo, admin, "pay-1"),
      confirmPayment(repo, admin, "pay-1").catch((error: unknown) => error),
    ]);

    expect(first).toMatchObject({ status: "CONFIRMED" });
    expect(second).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(transition).toHaveBeenCalledTimes(2);
  });
});

describe("readReceipt", () => {
  it("returns the receipt bytes to the owning coach", async () => {
    const repo = repoWith();
    const receipt = await readReceipt(repo, storageWith(), coach, "pay-1");

    expect(receipt).toMatchObject({ mime: "image/png", size: PNG_BYTES.byteLength });
  });

  it("returns the receipt to an admin of the same province", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const receipt = await readReceipt(repo, storageWith(), admin, "pay-1");

    expect(receipt.mime).toBe("image/png");
  });

  it("hides the receipt from another coach with 404", async () => {
    const repo = repoWith({ findPaymentById: vi.fn().mockResolvedValue({ ...paymentRow, coachId: "coach-2" }) });
    const failure = await failureOf(readReceipt(repo, storageWith(), coach, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("hides the receipt from an admin of another province with 404", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue({ ...adminRecord, province: "FARS" }) });
    const failure = await failureOf(readReceipt(repo, storageWith(), admin, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("returns 404 when the payment has no receipt", async () => {
    const repo = repoWith({ findPaymentById: vi.fn().mockResolvedValue({ ...paymentRow, receiptKey: null }) });
    const failure = await failureOf(readReceipt(repo, storageWith(), coach, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect((failure as AppError).message).toContain("بارگذاری نشده");
  });

  it("returns 404 when the stored file is missing", async () => {
    const repo = repoWith();
    const failure = await failureOf(readReceipt(repo, storageWith({ get: vi.fn().mockResolvedValue(null) }), coach, "pay-1"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("uploadReceipt", () => {
  it("rejects an admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(adminRecord) });
    const failure = await failureOf(uploadReceipt(repo, storageWith(), admin, "pay-8", receiptFile()));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("hides another coach payment with 404", async () => {
    const repo = repoWith({ findPaymentById: vi.fn().mockResolvedValue({ ...rejectedPayment, coachId: "coach-2" }) });
    const failure = await failureOf(uploadReceipt(repo, storageWith(), coach, "pay-8", receiptFile()));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("allows a new receipt only for a rejected payment", async () => {
    const repo = repoWith();
    const failure = await failureOf(uploadReceipt(repo, storageWith(), coach, "pay-1", receiptFile()));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("رد شده");
  });

  it("blocks the upload after the competition deadline", async () => {
    const repo = repoWith({
      findPaymentById: vi.fn().mockResolvedValue({ ...rejectedPayment, competitionDeadline: new Date("2026-10-01T00:00:00.000Z") }),
    });
    const failure = await failureOf(uploadReceipt(repo, storageWith(), coach, "pay-8", receiptFile()));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updatePayment).not.toHaveBeenCalled();
  });

  it("rejects a file that is not a real image", async () => {
    const repo = repoWith({ findPaymentById: vi.fn().mockResolvedValue(rejectedPayment) });
    const textFile = new File([new TextEncoder().encode("not an image")], "receipt.png", { type: "image/png" });
    const failure = await failureOf(uploadReceipt(repo, storageWith(), coach, "pay-8", textFile));

    expect(failure).toMatchObject({ status: 400, code: "INVALID_FILE_TYPE" });
    expect(repo.updatePayment).not.toHaveBeenCalled();
  });

  it("stores the new receipt and moves the payment back to pending", async () => {
    const repo = repoWith({
      findPaymentById: vi.fn().mockResolvedValue(rejectedPayment),
      updatePayment: vi.fn().mockResolvedValue({ ...rejectedPayment, receiptKey: "file-2", status: "PENDING", note: null }),
    });
    const storage = storageWith();
    const record = await uploadReceipt(repo, storage, coach, "pay-8", receiptFile());

    expect(storage.put).toHaveBeenCalledWith({ data: PNG_BYTES, mime: "image/png", folder: "receipts" });
    expect(repo.updatePayment).toHaveBeenCalledWith("pay-8", { receiptKey: "file-2", status: "PENDING", note: null });
    expect(record.receiptKey).toBe("file-2");
    expect(record.status).toBe("PENDING");
    expect(record.note).toBeNull();
  });
});
