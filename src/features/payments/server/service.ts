import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { readReceiptImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { DecidePaymentInput, PaymentListQuery } from "../schemas";
import type { PaymentFilters, PaymentRecord, PaymentsRepository, PaymentWithScope, UserIdentityRecord } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function paymentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "پرداخت یافت نشد.");
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
    return { province: identity.province, coachId: query.coachId, ...shared };
  }

  return { coachId: user.id, ...shared };
}

export async function listPayments(
  repo: PaymentsRepository,
  user: CurrentUser,
  query: PaymentListQuery,
): Promise<ListResult<PaymentRecord>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(user, identity, query);

  const [total, rows] = await Promise.all([repo.countPayments(filters), repo.findPayments(filters, (page - 1) * pageSize, pageSize)]);

  return { data: rows.map(toRecord), meta: { page, pageSize, total } };
}

export async function getPayment(repo: PaymentsRepository, user: CurrentUser, id: string): Promise<PaymentRecord> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findPaymentById(id);
  if (!row) throw paymentNotFound();

  const inScope = identity.role === "ADMIN" ? row.coachProvince === identity.province : row.coachId === user.id;
  if (!inScope) throw paymentNotFound();

  return toRecord(row);
}

export async function decidePayment(
  repo: PaymentsRepository,
  user: CurrentUser,
  id: string,
  input: DecidePaymentInput,
): Promise<PaymentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await repo.findPaymentById(id);
  if (!row || row.coachProvince !== identity.province) throw paymentNotFound();

  if (row.status !== "PENDING") {
    throw new AppError(409, "CONFLICT", "این پرداخت قبلا بررسی شده است.");
  }

  const data =
    input.status === "CONFIRMED" ? { status: "CONFIRMED" as const, note: null } : { status: "REJECTED" as const, note: input.note ?? null };
  const updated = await repo.updatePayment(id, data);

  return toRecord(updated);
}

export async function readReceipt(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
): Promise<{ data: Uint8Array; mime: string }> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findPaymentById(id);

  const inScope = row !== null && (identity.role === "ADMIN" ? row.coachProvince === identity.province : row.coachId === user.id);
  if (!inScope) throw paymentNotFound();

  if (row.receiptKey === null) {
    throw new AppError(404, "NOT_FOUND", "رسیدی برای این پرداخت بارگذاری نشده است.");
  }

  const file = await storage.get(row.receiptKey);
  if (!file) {
    throw new AppError(404, "NOT_FOUND", "فایل رسید یافت نشد.");
  }

  return { data: file.data, mime: file.mime };
}

export async function uploadReceipt(
  repo: PaymentsRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
  receiptFile: File,
): Promise<PaymentRecord> {
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
  const stored = await storage.put(receipt);
  const updated = await repo.updatePayment(id, { receiptKey: stored.id, status: "PENDING", note: null });

  return toRecord(updated);
}
