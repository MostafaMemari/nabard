import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import { toPersianDigits } from "@/lib/format";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { CreateTransferRequestInput, ReassignStudentsInput, TransferListQuery } from "../schemas";
import type { CoachTransferRequest, TransferLookupResult, TransferRequest, TransferStatus } from "../types";
import type { StudentLookupRow, TransferFilters, TransfersRepository, TransferWithScope, UserIdentityRecord } from "./repository";
import { StudentOwnerChangedError, TransferGenderMismatchError } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function transferNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "درخواست انتقال یافت نشد.");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

async function requireActiveUser(repo: TransfersRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

export function maskStudentName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length <= 1) return parts[0] ?? "";

  return [parts[0], ...parts.slice(1).map((part) => `${part.charAt(0)}…`)].join(" ");
}

function toClientRecord(row: {
  id: string;
  studentId: string;
  studentName: string;
  fromCoachId: string;
  fromCoachName: string;
  toCoachId: string;
  toCoachName: string;
  status: TransferStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}): TransferRequest {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    fromCoachId: row.fromCoachId,
    fromCoachName: row.fromCoachName,
    toCoachId: row.toCoachId,
    toCoachName: row.toCoachName,
    status: row.status,
    note: row.note,
    decidedAt: row.decidedAt === null ? null : row.decidedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toCoachRecord(
  row: {
    id: string;
    status: TransferStatus;
    studentName: string;
    fromCoachId: string;
    fromCoachName: string;
    toCoachId: string;
    toCoachName: string;
    note: string | null;
    decidedAt: Date | null;
    createdAt: Date;
  },
  coachId: string,
): CoachTransferRequest {
  const incoming = row.toCoachId === coachId;

  return {
    id: row.id,
    direction: incoming ? "incoming" : "outgoing",
    status: row.status,
    toCoachId: row.toCoachId,
    toCoachName: row.toCoachName,
    fromCoachName: incoming ? row.fromCoachName : null,
    studentName: incoming ? row.studentName : null,
    note: incoming ? row.note : null,
    createdAt: incoming ? row.createdAt.toISOString() : null,
    decidedAt: row.decidedAt === null ? null : row.decidedAt.toISOString(),
  };
}

function validateStudentForTransfer(identity: UserIdentityRecord, student: StudentLookupRow): void {
  if (student.coachId === identity.id) {
    throw new AppError(409, "CONFLICT", "این هنرجو هم اکنون در باشگاه شما ثبت است.");
  }

  if (student.coachProvince !== identity.province) {
    throw new AppError(403, "FORBIDDEN", "انتقال هنرجو بین استان ها فعلا امکان پذیر نیست.");
  }

  if (identity.gender === null) {
    throw new AppError(403, "FORBIDDEN", "جنسیت شما ثبت نشده است؛ با ادمین استان تماس بگیرید.");
  }

  if (student.gender !== identity.gender) {
    throw new AppError(400, "VALIDATION_ERROR", "جنسیت هنرجو باید با جنسیت شما یکسان باشد.");
  }
}

export async function lookupTransferStudent(
  repo: TransfersRepository,
  user: CurrentUser,
  nationalCode: string,
): Promise<TransferLookupResult> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentByNationalCode(nationalCode);
  if (!student) throw new AppError(404, "NOT_FOUND", "هنرجویی با این کد ملی یافت نشد.");

  validateStudentForTransfer(identity, student);

  return { maskedName: maskStudentName(student.fullName), currentCoachName: student.coachName };
}

export async function createTransferRequest(
  repo: TransfersRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: CreateTransferRequestInput,
): Promise<TransferRequest> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentByNationalCode(input.nationalCode);
  if (!student) throw new AppError(404, "NOT_FOUND", "هنرجویی با این کد ملی یافت نشد.");

  validateStudentForTransfer(identity, student);

  const pending = await repo.findPendingTransferByStudentId(student.id);
  if (pending) {
    throw new AppError(409, "CONFLICT", "یک درخواست انتقال در انتظار بررسی برای این هنرجو وجود دارد.");
  }

  const row = await repo.createTransfer({ studentId: student.id, fromCoachId: student.coachId, toCoachId: identity.id });
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.transferRequested,
    entityType: auditEntityTypes.transfer,
    entityId: row.id,
    details: { province: identity.province },
  });

  return toClientRecord(row);
}

export async function listTransferRequests(
  repo: TransfersRepository,
  user: CurrentUser,
  query: TransferListQuery,
): Promise<ListResult<TransferRequest | CoachTransferRequest>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);

  if (identity.role === "ADMIN") {
    const filters: TransferFilters = { province: provinceOf(identity), status: query.status };
    const [total, rows] = await Promise.all([repo.countTransfers(filters), repo.findTransfers(filters, (page - 1) * pageSize, pageSize)]);

    return { data: rows.map(toClientRecord), meta: { page, pageSize, total } };
  }

  if (identity.role === "COACH") {
    const filters = { status: query.status };
    const [total, rows] = await Promise.all([
      repo.countCoachTransfers(identity.id, filters),
      repo.findCoachTransfers(identity.id, filters, (page - 1) * pageSize, pageSize),
    ]);

    return { data: rows.map((row) => toCoachRecord(row, identity.id)), meta: { page, pageSize, total } };
  }

  throw forbidden();
}

export async function decideTransferRequest(
  repo: TransfersRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  status: Exclude<TransferStatus, "PENDING">,
  note: string | null,
): Promise<TransferRequest> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findTransferById(id);
  if (!current || current.fromCoachProvince !== provinceOf(identity)) throw transferNotFound();

  let updated: TransferWithScope | null;
  try {
    updated = await repo.decideTransferFromPending(id, {
      status,
      note: status === "APPROVED" ? null : note,
      decidedById: user.id,
    });
  } catch (error) {
    if (error instanceof StudentOwnerChangedError) {
      throw new AppError(409, "CONFLICT", "مالکیت این هنرجو تغییر کرده است و درخواست قابل تأیید نیست.");
    }
    if (error instanceof TransferGenderMismatchError) {
      throw new AppError(409, "CONFLICT", "جنسیت هنرجو با جنسیت مربی مقصد یکسان نیست و درخواست قابل تأیید نیست.");
    }

    throw error;
  }
  if (!updated) throw new AppError(409, "CONFLICT", "این درخواست قبلا بررسی شده است.");

  await audit.createAuditLog({
    actorId: user.id,
    action: status === "APPROVED" ? auditActions.transferApproved : auditActions.transferRejected,
    entityType: auditEntityTypes.transfer,
    entityId: updated.id,
    details: { province: provinceOf(identity) },
  });

  return toClientRecord(updated);
}

export async function reassignCoachStudents(
  repo: TransfersRepository,
  audit: AuditRepository,
  user: CurrentUser,
  coachId: string,
  input: ReassignStudentsInput,
): Promise<{ moved: number }> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const source = await repo.findCoachTargetById(coachId);
  if (!source || source.province !== provinceOf(identity)) throw new AppError(404, "NOT_FOUND", "مربی یافت نشد.");

  const target = await repo.findCoachTargetById(input.toCoachId);
  if (!target || target.province !== provinceOf(identity)) {
    throw new AppError(400, "VALIDATION_ERROR", "مربی مقصد باید در استان شما باشد.");
  }
  if (!target.isActive) {
    throw new AppError(400, "VALIDATION_ERROR", "مربی مقصد فعال نیست.");
  }
  if (target.id === source.id) {
    throw new AppError(400, "VALIDATION_ERROR", "مربی مقصد نباید همان مربی فعلی باشد.");
  }

  const mismatchedCount = await repo.countCoachStudentsNotOfGender(source.id, target.gender);
  if (target.gender === null && mismatchedCount > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "جنسیت مربی مقصد ثبت نشده است؛ ابتدا جنسیت او را مشخص کنید.");
  }
  if (mismatchedCount > 0) {
    throw new AppError(
      409,
      "CONFLICT",
      `مربی مقصد باید هم جنسیت همه هنرجوها باشد؛ ${toPersianDigits(mismatchedCount)} هنرجو با جنسیت دیگری در بین آن ها هست. ابتدا آن ها را منتقل کنید.`,
    );
  }

  const moved = await repo.reassignCoachStudents(source.id, target.id);
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.studentsReassigned,
    entityType: auditEntityTypes.coach,
    entityId: source.id,
    details: { province: provinceOf(identity), moved },
  });

  return { moved };
}
