import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { deleteStorageFileQuietly } from "@/lib/storage";
import { readReceiptImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { PaymentListQuery } from "../schemas";
import type {
  PaymentFilters,
  PaymentRecord,
  PaymentsRepository,
  PaymentTransitionInput,
  PaymentWithScope,
  UserIdentityRecord,
} from "./repository";

const DEFAULT_PAGE_SIZE = 100;

// Receipts live in R2 and are displayed straight from its public endpoint;
// receiptUrl is null when the file is not on R2 (local development without
// R2 env vars) or the payment has no receipt at all.
type PaymentPayload = PaymentRecord & { receiptUrl: string | null };

async function withReceiptUrls(storage: Storage, records: PaymentRecord[]): Promise<PaymentPayload[]> {
  if (records.length === 0) return [];

  const ids = [...new Set(records.map((record) => record.receiptKey).filter((key): key is string => key !== null))];
  const urls = ids.length > 0 ? await storage.getUrls(ids) : new Map<string, string>();

  return records.map((record) => ({
    ...record,
    receiptUrl: record.receiptKey === null ? null : (urls.get(record.receiptKey) ?? null),
  }));
}

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function paymentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "پرداخت یافت نشد.");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

async function requireActiveUser(repo: PaymentsRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function toRecord(row: PaymentWithScope): PaymentRecord {
  return {
    id: row.id,
    competitionId: row.competitionId,
    coachId: row.coachId,
    amount: row.amount,
    receiptKey: row.receiptKey,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toFilters(user: CurrentUser, identity: UserIdentityRecord, query: PaymentListQuery): PaymentFilters {
  const shared = {
    status: query.status,
    competitionId: query.competitionId,
  };

  if (identity.role === "ADMIN") {
    return { province: provinceOf(identity), coachId: query.coachId, ...shared };
  }

  if (identity.role === "SUPER_ADMIN") {
    return { province: query.province, coachId: query.coachId, ...shared };
  }

  return { coachId: user.id, ...shared };
}

export async function listPayments(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  query: PaymentListQuery,
): Promise<ListResult<PaymentPayload>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(user, identity, query);

  const [total, rows] = await Promise.all([repo.countPayments(filters), repo.findPayments(filters, (page - 1) * pageSize, pageSize)]);

  return { data: await withReceiptUrls(storage, rows.map(toRecord)), meta: { page, pageSize, total } };
}

export async function getPayment(repo: PaymentsRepository, storage: Storage, user: CurrentUser, id: string): Promise<PaymentPayload> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findPaymentById(id);
  if (!row) throw paymentNotFound();

  const inScope =
    identity.role === "SUPER_ADMIN" || (identity.role === "ADMIN" ? row.coachProvince === provinceOf(identity) : row.coachId === user.id);
  if (!inScope) throw paymentNotFound();

  const [record] = await withReceiptUrls(storage, [toRecord(row)]);
  return record;
}

async function decidePayment(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
  input: PaymentTransitionInput,
): Promise<PaymentPayload> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findPaymentById(id);
  if (!current || current.coachProvince !== identity.province) throw paymentNotFound();

  const updated = await repo.transitionPaymentFromPending(id, input);
  if (updated) {
    const [record] = await withReceiptUrls(storage, [toRecord(updated)]);
    return record;
  }

  const row = await repo.findPaymentById(id);
  if (row === null) throw paymentNotFound();
  if (row.status === "CONFIRMED") {
    throw new AppError(
      409,
      "CONFLICT",
      input.status === "CONFIRMED" ? "این پرداخت قبلا تأیید شده است." : "این پرداخت تأیید شده و قابل رد کردن نیست.",
    );
  }
  if (row.status === "REJECTED") {
    throw new AppError(
      409,
      "CONFLICT",
      input.status === "CONFIRMED" ? "این پرداخت رد شده است؛ پس از بارگذاری رسید جدید قابل تأیید است." : "این پرداخت قبلا رد شده است.",
    );
  }
  throw new AppError(409, "CONFLICT", "این پرداخت قبلا بررسی شده است.");
}

export async function confirmPayment(repo: PaymentsRepository, storage: Storage, user: CurrentUser, id: string): Promise<PaymentPayload> {
  return decidePayment(repo, storage, user, id, { status: "CONFIRMED", note: null });
}

export async function rejectPayment(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
  note: string,
): Promise<PaymentPayload> {
  return decidePayment(repo, storage, user, id, { status: "REJECTED", note });
}

export async function readReceipt(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
): Promise<{ stream: ReadableStream<Uint8Array>; mime: string; size: number }> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findPaymentById(id);

  const inScope =
    row !== null &&
    (identity.role === "SUPER_ADMIN" || (identity.role === "ADMIN" ? row.coachProvince === provinceOf(identity) : row.coachId === user.id));
  if (!inScope) throw paymentNotFound();

  if (row.receiptKey === null) {
    throw new AppError(404, "NOT_FOUND", "رسیدی برای این پرداخت بارگذاری نشده است.");
  }

  const file = await storage.get(row.receiptKey);
  if (!file) {
    throw new AppError(404, "NOT_FOUND", "فایل رسید یافت نشد.");
  }

  return { stream: file.stream, mime: file.mime, size: file.size };
}

export async function uploadReceipt(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
  receiptFile: File,
): Promise<PaymentPayload> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const row = await repo.findPaymentById(id);
  if (!row || row.coachId !== user.id) throw paymentNotFound();

  if (row.status !== "REJECTED") {
    throw new AppError(409, "CONFLICT", "فقط پرداخت رد شده قابل ارسال مجدد است.");
  }

  if (row.competitionDeadline.getTime() < Date.now()) {
    throw new AppError(409, "CONFLICT", "مهلت ثبت نام این مسابقه به پایان رسیده است و ارسال رسید ممکن نیست.");
  }

  const receipt = await readReceiptImage(receiptFile);
  const stored = await storage.put({ ...receipt, folder: "receipts" });

  try {
    const updated = await repo.updatePayment(id, { receiptKey: stored.id, status: "PENDING", note: null });
    if (row.receiptKey !== null && row.receiptKey !== stored.id) {
      await deleteStorageFileQuietly(storage, row.receiptKey);
    }

    const [record] = await withReceiptUrls(storage, [toRecord(updated)]);
    return record;
  } catch (error) {
    await deleteStorageFileQuietly(storage, stored.id);
    throw error;
  }
}
