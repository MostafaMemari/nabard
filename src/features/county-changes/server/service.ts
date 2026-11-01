import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { CountyChangeListQuery } from "../schemas";
import type { CountyChangeRequest, CountyChangeStatus } from "../types";
import type { CountyChangeRequestWithScope, CountyChangesRepository, CountyRecord, UserIdentityRecord } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function requestNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "درخواست یافت نشد.");
}

async function requireActiveUser(repo: CountyChangesRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function toClientRecord(row: {
  id: string;
  coachId: string;
  coachName: string;
  fromCountyId: string;
  fromCountyName: string;
  toCountyId: string;
  toCountyName: string;
  status: CountyChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}): CountyChangeRequest {
  return {
    id: row.id,
    coachId: row.coachId,
    coachName: row.coachName,
    fromCountyId: row.fromCountyId,
    fromCountyName: row.fromCountyName,
    toCountyId: row.toCountyId,
    toCountyName: row.toCountyName,
    status: row.status,
    note: row.note,
    decidedAt: row.decidedAt === null ? null : row.decidedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function stripScope(row: CountyChangeRequestWithScope): CountyChangeRequest {
  const { coachProvince: _coachProvince, ...record } = row;

  return toClientRecord(record);
}

export async function getMyCountyChange(repo: CountyChangesRepository, user: CurrentUser): Promise<CountyChangeRequest | null> {
  await requireActiveUser(repo, user);
  if (user.role !== "COACH") throw forbidden();

  const row = await repo.findLatestRequestByCoachId(user.id);

  return row === null ? null : toClientRecord(row);
}

export async function createCountyChange(
  repo: CountyChangesRepository,
  user: CurrentUser,
  input: { toCountyId: string },
): Promise<CountyChangeRequest> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!identity.countyId) {
    throw new AppError(409, "CONFLICT", "ابتدا شهرستان مربی باید توسط مدیر استان تعیین شود.");
  }

  const pending = await repo.findPendingRequestByCoachId(user.id);
  if (pending) {
    throw new AppError(409, "CONFLICT", "یک درخواست تغییر شهرستان در انتظار بررسی دارید.");
  }

  const toCounty: CountyRecord | null = await repo.findCountyById(input.toCountyId);
  if (!toCounty || toCounty.province !== identity.province) {
    throw new AppError(400, "VALIDATION_ERROR", "شهرستان انتخاب شده معتبر نیست.");
  }
  if (toCounty.id === identity.countyId) {
    throw new AppError(400, "VALIDATION_ERROR", "شهرستان انتخاب شده با شهرستان فعلی یکسان است.");
  }

  const row = await repo.createCountyChange({
    coachId: user.id,
    fromCountyId: identity.countyId,
    toCountyId: toCounty.id,
  });

  return toClientRecord(row);
}

export async function listCountyChanges(
  repo: CountyChangesRepository,
  user: CurrentUser,
  query: CountyChangeListQuery,
): Promise<ListResult<CountyChangeRequest>> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = { province: identity.province, status: query.status };

  const [total, rows] = await Promise.all([
    repo.countCountyChanges(filters),
    repo.findCountyChanges(filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: rows.map(stripScope), meta: { page, pageSize, total } };
}

export async function decideCountyChange(
  repo: CountyChangesRepository,
  user: CurrentUser,
  id: string,
  status: Exclude<CountyChangeStatus, "PENDING">,
  note: string | null,
): Promise<CountyChangeRequest> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findCountyChangeById(id);
  if (!current || current.coachProvince !== identity.province) throw requestNotFound();

  const updated = await repo.decideCountyChangeFromPending(id, {
    status,
    note: status === "APPROVED" ? null : note,
    decidedById: user.id,
  });
  if (!updated) throw new AppError(409, "CONFLICT", "این درخواست قبلا بررسی شده است.");

  return stripScope(updated);
}
