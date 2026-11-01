import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { RefundListQuery } from "../schemas";
import type { RefundFilters, RefundRecord, RefundsRepository, RefundWithScope, UserIdentityRecord } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function refundNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "بازپرداخت یافت نشد.");
}

async function requireActiveUser(repo: RefundsRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

function toFilters(user: CurrentUser, identity: UserIdentityRecord, query: RefundListQuery): RefundFilters {
  if (identity.role === "ADMIN") {
    return { province: provinceOf(identity), status: query.status };
  }

  return { coachId: user.id, status: query.status };
}

export async function listRefunds(repo: RefundsRepository, user: CurrentUser, query: RefundListQuery): Promise<ListResult<RefundRecord>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(user, identity, query);

  const [total, rows] = await Promise.all([repo.countRefunds(filters), repo.findRefunds(filters, (page - 1) * pageSize, pageSize)]);

  return { data: rows.map(stripScope), meta: { page, pageSize, total } };
}

function stripScope(row: RefundWithScope): RefundRecord {
  const { coachProvince: _coachProvince, ...record } = row;

  return record;
}

export async function completeRefund(
  repo: RefundsRepository,
  user: CurrentUser,
  id: string,
  input: { note: string | null },
): Promise<RefundRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findRefundById(id);
  if (!current || current.coachProvince !== identity.province) throw refundNotFound();

  const updated = await repo.completeRefundFromPending(id, { processedById: user.id, note: input.note });
  if (updated) return stripScope(updated);

  throw new AppError(409, "CONFLICT", "این بازپرداخت قبلا ثبت شده است.");
}
