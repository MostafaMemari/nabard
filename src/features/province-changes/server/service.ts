import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { CreateProvinceChangeInput, ProvinceChangeListQuery, RejectProvinceChangeInput } from "../schemas";
import type { ProvinceChangeRepository, ProvinceChangeRow, ProvinceChangeStatus, UserIdentityRecord } from "./repository";
import { ProvinceChangeGenderMismatchError, ProvinceChangeOwnerChangedError } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

function requestNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "درخواست تغییر استان یافت نشد");
}

function studentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "هنرجو یافت نشد");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

async function requireActiveUser(repo: ProvinceChangeRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

// The current coach hands the student over to a coach of ANOTHER province.
// The admin of the destination province approves or rejects the request.
export async function createProvinceChangeRequest(
  repo: ProvinceChangeRepository,
  audit: AuditRepository,
  user: CurrentUser,
  studentId: string,
  input: CreateProvinceChangeInput,
): Promise<ProvinceChangeRow> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentForMove(studentId);
  if (!student || student.coachId !== user.id) throw studentNotFound();
  if (student.coachProvince === null) throw forbidden();
  if (input.toProvince === student.coachProvince) {
    throw new AppError(400, "VALIDATION_ERROR", "استان مقصد باید با استان فعلی هنرجو متفاوت باشد");
  }

  const target = await repo.findCoachTargetById(input.toCoachId);
  if (!target || target.province !== input.toProvince) {
    throw new AppError(400, "VALIDATION_ERROR", "مربی مقصد باید در استان مقصد باشد");
  }
  if (!target.isActive) {
    throw new AppError(400, "VALIDATION_ERROR", "مربی مقصد فعال نیست");
  }
  if (target.id === student.coachId) {
    throw new AppError(400, "VALIDATION_ERROR", "مربی مقصد نباید همان مربی فعلی باشد");
  }
  if (target.gender === null || target.gender !== student.gender) {
    throw new AppError(400, "VALIDATION_ERROR", "جنسیت مربی مقصد باید با جنسیت هنرجو یکسان باشد");
  }

  if (await repo.hasPendingMoveRequest(studentId)) {
    throw new AppError(409, "CONFLICT", "یک درخواست انتقال یا تغییر استان در انتظار بررسی برای این هنرجو وجود دارد");
  }

  const row = await repo.createProvinceChange({
    studentId,
    fromCoachId: user.id,
    fromProvince: student.coachProvince,
    toProvince: input.toProvince,
    toCoachId: input.toCoachId,
  });
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.provinceChangeRequested,
    entityType: auditEntityTypes.provinceChange,
    entityId: row.id,
    details: { fromProvince: student.coachProvince, toProvince: input.toProvince },
  });

  return row;
}

export async function listProvinceChangeRequests(
  repo: ProvinceChangeRepository,
  user: CurrentUser,
  query: ProvinceChangeListQuery,
): Promise<ListResult<ProvinceChangeRow>> {
  const identity = await requireActiveUser(repo, user);

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters: { status?: ProvinceChangeStatus; toProvince?: Province; fromCoachId?: string } = { status: query.status };

  if (identity.role === "ADMIN") {
    // The admin of the destination province reviews requests moving students
    // INTO their province.
    filters.toProvince = provinceOf(identity);
  } else if (identity.role === "COACH") {
    filters.fromCoachId = identity.id;
  } else {
    throw forbidden();
  }

  const [total, rows] = await Promise.all([
    repo.countProvinceChanges(filters),
    repo.findProvinceChanges(filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: rows, meta: { page, pageSize, total } };
}

export async function decideProvinceChangeRequest(
  repo: ProvinceChangeRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  status: Exclude<ProvinceChangeStatus, "PENDING">,
  note: string | null,
): Promise<ProvinceChangeRow> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findProvinceChangeById(id);
  if (!current || current.toProvince !== provinceOf(identity)) throw requestNotFound();

  let updated: ProvinceChangeRow | null;
  try {
    updated = await repo.decideProvinceChangeFromPending(id, {
      status,
      note: status === "APPROVED" ? null : note,
      decidedById: user.id,
    });
  } catch (error) {
    if (error instanceof ProvinceChangeOwnerChangedError) {
      throw new AppError(409, "CONFLICT", "مالکیت این هنرجو تغییر کرده است و درخواست قابل تأیید نیست");
    }
    if (error instanceof ProvinceChangeGenderMismatchError) {
      throw new AppError(409, "CONFLICT", "جنسیت هنرجو با جنسیت مربی مقصد یکسان نیست و درخواست قابل تأیید نیست");
    }

    throw error;
  }
  if (!updated) throw new AppError(409, "CONFLICT", "این درخواست قبلا بررسی شده است");

  await audit.createAuditLog({
    actorId: user.id,
    action: status === "APPROVED" ? auditActions.provinceChangeApproved : auditActions.provinceChangeRejected,
    entityType: auditEntityTypes.provinceChange,
    entityId: updated.id,
    details: { toProvince: provinceOf(identity) },
  });

  return updated;
}

export function approveProvinceChangeRequest(
  repo: ProvinceChangeRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
): Promise<ProvinceChangeRow> {
  return decideProvinceChangeRequest(repo, audit, user, id, "APPROVED", null);
}

export function rejectProvinceChangeRequest(
  repo: ProvinceChangeRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: RejectProvinceChangeInput,
): Promise<ProvinceChangeRow> {
  return decideProvinceChangeRequest(repo, audit, user, id, "REJECTED", input.note);
}
