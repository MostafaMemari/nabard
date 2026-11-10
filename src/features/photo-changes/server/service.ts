import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { deleteStorageFileQuietly } from "@/lib/storage";
import { readProfileImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { PhotoChangeListQuery, RejectPhotoChangeInput } from "../schemas";
import type { DecidePhotoChangeInput, PhotoChangeRepository, PhotoChangeRow, PhotoChangeStatus, UserIdentityRecord } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function requestNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "درخواست تغییر عکس یافت نشد.");
}

function studentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "هنرجو یافت نشد.");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

async function requireActiveUser(repo: PhotoChangeRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function pendingDuplicate(): AppError {
  return new AppError(409, "CONFLICT", "یک درخواست تغییر عکس در انتظار بررسی برای این هنرجو وجود دارد.");
}

// Coach creates a photo change request for their own student: the uploaded
// image is stored and attached to the request; the student profile photo is
// only replaced when a province admin approves the request.
export async function createPhotoChangeRequest(
  repo: PhotoChangeRepository,
  storage: Storage,
  audit: AuditRepository,
  user: CurrentUser,
  studentId: string,
  file: File,
): Promise<PhotoChangeRow> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentById(studentId);
  if (!student || student.coachId !== user.id) throw studentNotFound();
  if (await repo.findPendingPhotoChangeByStudentId(studentId)) throw pendingDuplicate();

  const image = await readProfileImage(file);
  const stored = await storage.put({ ...image, folder: "student-photos" });

  try {
    const row = await repo.createPhotoChange({ studentId, newFileId: stored.id });
    await audit.createAuditLog({
      actorId: user.id,
      action: auditActions.photoChangeRequested,
      entityType: auditEntityTypes.photoChange,
      entityId: row.id,
      details: { studentId },
    });

    return row;
  } catch (error) {
    await deleteStorageFileQuietly(storage, stored.id);
    throw error;
  }
}

export async function listPhotoChangeRequests(
  repo: PhotoChangeRepository,
  user: CurrentUser,
  query: PhotoChangeListQuery,
): Promise<ListResult<PhotoChangeRow>> {
  const identity = await requireActiveUser(repo, user);

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters: { status?: PhotoChangeStatus; province?: Province; coachId?: string } = { status: query.status };

  if (identity.role === "ADMIN") {
    filters.province = provinceOf(identity);
  } else if (identity.role === "COACH") {
    filters.coachId = identity.id;
  } else {
    throw forbidden();
  }

  const [total, rows] = await Promise.all([
    repo.countPhotoChanges(filters),
    repo.findPhotoChanges(filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: rows, meta: { page, pageSize, total } };
}

// The pending photo is served through an authenticated endpoint (never the
// public R2 url) so only the owning coach and the province admin can see it
// until it is approved.
export async function readPhotoChangeFile(
  repo: PhotoChangeRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
): Promise<{ stream: ReadableStream<Uint8Array>; mime: string; size: number }> {
  const identity = await requireActiveUser(repo, user);

  const request = await repo.findPhotoChangeFileId(id);
  if (!request) throw requestNotFound();

  const inScope =
    identity.role === "ADMIN"
      ? request.studentCoachProvince === provinceOf(identity)
      : identity.role === "COACH" && request.studentCoachId === user.id;
  if (!inScope) throw requestNotFound();

  // The request row stays as history after its photo was purged from storage
  // (rejection or a later approval replacing it).
  if (request.fileId === null) throw new AppError(404, "NOT_FOUND", "فایل تصویر یافت نشد.");

  const file = await storage.get(request.fileId);
  if (!file) throw new AppError(404, "NOT_FOUND", "فایل تصویر یافت نشد.");

  return { stream: file.stream, mime: file.mime, size: file.size };
}

async function decidePhotoChange(
  repo: PhotoChangeRepository,
  storage: Storage,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: DecidePhotoChangeInput,
): Promise<PhotoChangeRow> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findPhotoChangeById(id);
  if (!current || current.coachProvince !== provinceOf(identity)) throw requestNotFound();

  const result = await repo.decidePhotoChangeFromPending(id, input);
  if (!result) throw new AppError(409, "CONFLICT", "این درخواست قبلا بررسی شده است.");

  if (input.status === "APPROVED" && result.replacedFileId) {
    await deleteStorageFileQuietly(storage, result.replacedFileId);
  }

  if (input.status === "REJECTED" && result.row.newFileId !== null) {
    // The pending photo was never attached to the profile; remove its object
    // from storage. The request row stays as history (its file link is nulled
    // by the database when the stored file row is deleted).
    await deleteStorageFileQuietly(storage, result.row.newFileId);
  }

  await audit.createAuditLog({
    actorId: user.id,
    action: input.status === "APPROVED" ? auditActions.photoChangeApproved : auditActions.photoChangeRejected,
    entityType: auditEntityTypes.photoChange,
    entityId: result.row.id,
    details: { province: provinceOf(identity) },
  });

  return result.row;
}

export function approvePhotoChangeRequest(
  repo: PhotoChangeRepository,
  storage: Storage,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
): Promise<PhotoChangeRow> {
  return decidePhotoChange(repo, storage, audit, user, id, {
    status: "APPROVED",
    note: null,
    decidedById: user.id,
  });
}

export async function rejectPhotoChangeRequest(
  repo: PhotoChangeRepository,
  storage: Storage,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: RejectPhotoChangeInput,
): Promise<PhotoChangeRow> {
  return decidePhotoChange(repo, storage, audit, user, id, {
    status: "REJECTED",
    note: input.note,
    decidedById: user.id,
  });
}
