import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { deleteStorageFileQuietly } from "@/lib/storage";
import { readProfileImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { CreateStudentInput, RegistrationRequestListQuery, StudentListQuery, UpdateStudentBeltInput } from "../schemas";
import type {
  RegistrationRequestFilters,
  RegistrationRequestRecord,
  RegistrationRequestWithCoach,
  StudentDetail,
  StudentDocumentRecord,
  StudentFilters,
  StudentRecord,
  StudentRepository,
  StudentWithCoach,
  UserIdentityRecord,
} from "./repository";
import { isStudentDocumentType } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

// Photos live in R2 and are displayed straight from its public endpoint:
// no signature and no backend hop. When a file url cannot be resolved
// (local development without the public endpoint) the photo url is null and
// the UI shows the fallback avatar. The internal file id is stripped from
// the response payload.
async function resolveFileUrls(storage: Storage, fileIds: Array<string | null | undefined>): Promise<Map<string, string>> {
  const ids = [...new Set(fileIds.filter((fileId): fileId is string => Boolean(fileId)))];
  return ids.length > 0 ? storage.getUrls(ids) : new Map<string, string>();
}

async function withPhotoUrls<T extends { id: string; photoFileId?: string | null }>(
  storage: Storage,
  records: T[],
): Promise<Omit<T, "photoFileId">[]> {
  if (records.length === 0) return records;

  const urls = await resolveFileUrls(
    storage,
    records.map((record) => record.photoFileId),
  );

  return records.map((record) => {
    const { photoFileId, ...rest } = record;
    return {
      ...rest,
      ...(photoFileId ? { photoUrl: urls.get(photoFileId) ?? null } : {}),
    };
  });
}

function documentsWithUrls(documents: StudentDocumentRecord[], urls: Map<string, string>): StudentDocumentRecord[] {
  return documents.map((document) => ({ ...document, url: urls.get(document.fileId) ?? null }));
}

export function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

function studentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "هنرجو یافت نشد");
}

export function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

function invalidBelt(): AppError {
  return new AppError(400, "VALIDATION_ERROR", "کمربند انتخاب شده معتبر نیست");
}

export function coachGenderMissing(): AppError {
  return new AppError(400, "VALIDATION_ERROR", "جنسیت شما ثبت نشده است؛ با ادمین استان تماس بگیرید");
}

export async function requireActiveUser(repo: StudentRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function toStudentRecord(student: StudentWithCoach): StudentRecord {
  return {
    id: student.id,
    fullName: student.fullName,
    gender: student.gender,
    nationalCode: student.nationalCode,
    birthDate: student.birthDate,
    mobile: student.mobile,
    insuranceDate: student.insuranceDate,
    tkdBankChargeYear: student.tkdBankChargeYear,
    beltCertificateDate: student.beltCertificateDate,
    beltId: student.beltId,
    coachId: student.coachId,
    profileStatus: student.profileStatus,
    profileNote: student.profileNote,
    approvedAt: student.approvedAt,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

function toFilters(user: CurrentUser, identity: UserIdentityRecord, query: StudentListQuery): StudentFilters {
  const shared = {
    gender: query.gender,
    beltId: query.beltId,
    search: query.search?.trim() || undefined,
  };

  if (identity.role === "ADMIN") {
    return { province: provinceOf(identity), coachId: query.coachId, ...shared };
  }

  if (identity.role === "SUPER_ADMIN") {
    return { province: query.province, coachId: query.coachId, ...shared };
  }

  return { coachId: user.id, ...shared };
}

export async function listStudents(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  query: StudentListQuery,
): Promise<ListResult<StudentRecord>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(user, identity, query);

  const [total, students] = await Promise.all([repo.countStudents(filters), repo.findStudents(filters, (page - 1) * pageSize, pageSize)]);

  return { data: await withPhotoUrls(storage, students), meta: { page, pageSize, total } };
}

export async function getStudent(repo: StudentRepository, storage: Storage, user: CurrentUser, id: string): Promise<StudentDetail> {
  const identity = await requireActiveUser(repo, user);
  const student = await repo.findStudentById(id);
  if (!student) throw studentNotFound();

  const inScope =
    identity.role === "SUPER_ADMIN" ||
    (identity.role === "ADMIN" ? student.coachProvince === provinceOf(identity) : student.coachId === user.id);
  if (!inScope) throw studentNotFound();

  const documents = await repo.findStudentDocuments(id);
  const urls = await resolveFileUrls(
    storage,
    documents.map((document) => document.fileId),
  );
  const photoDocument = documents.find((document) => document.type === "PHOTO");

  return {
    ...toStudentRecord(student),
    coachName: student.coachName,
    documents: documentsWithUrls(documents, urls),
    ...(photoDocument ? { photoUrl: urls.get(photoDocument.fileId) ?? null } : {}),
  };
}

function duplicateApprovedNationalCode(): AppError {
  return new AppError(409, "CONFLICT", "هنرجوی تأیید شده ای با این کد ملی وجود دارد");
}

function pendingRequestExists(): AppError {
  return new AppError(409, "CONFLICT", "برای این کد ملی یک درخواست ثبت هنرجو در انتظار بررسی وجود دارد");
}

function requestNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "درخواست ثبت هنرجو یافت نشد");
}

function approvedRequestLocked(): AppError {
  return new AppError(409, "CONFLICT", "این درخواست تأیید شده و قابل تغییر نیست");
}

// The coach registers a student as a request — not a student row. The data
// becomes a real student only when a province admin approves the request.
export async function createRegistrationRequest(
  repo: StudentRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: CreateStudentInput,
): Promise<RegistrationRequestRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!identity.gender) throw coachGenderMissing();

  if (await repo.findNationalCodeOwner(input.nationalCode)) throw duplicateApprovedNationalCode();
  if (await repo.findPendingRequestByNationalCode(input.nationalCode)) throw pendingRequestExists();
  if (!(await repo.activeBeltExists(input.beltId))) throw invalidBelt();

  const row = await repo.createRegistrationRequest({
    fullName: input.fullName,
    gender: identity.gender,
    nationalCode: input.nationalCode,
    birthDate: new Date(input.birthDate),
    mobile: input.mobile,
    beltCertificateDate: input.beltCertificateDate ? new Date(input.beltCertificateDate) : null,
    insuranceDate: input.insuranceDate ? new Date(input.insuranceDate) : null,
    tkdBankChargeYear: input.tkdBankChargeYear ? Number(input.tkdBankChargeYear) : null,
    beltId: input.beltId,
    coachId: user.id,
  });

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.registrationRequested,
    entityType: auditEntityTypes.registrationRequest,
    entityId: row.id,
    details: { nationalCode: input.nationalCode },
  });

  return row;
}

// A rejected (or still pending) request can be corrected by its coach; every
// edit resubmits it for review. Approved requests are locked history.
export async function updateRegistrationRequest(
  repo: StudentRepository,
  user: CurrentUser,
  id: string,
  input: CreateStudentInput,
): Promise<RegistrationRequestRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const request = await repo.findRegistrationRequestById(id);
  if (!request || request.coachId !== user.id) throw requestNotFound();
  if (request.status === "APPROVED") throw approvedRequestLocked();

  if (await repo.findNationalCodeOwner(input.nationalCode)) throw duplicateApprovedNationalCode();
  if (await repo.findPendingRequestByNationalCode(input.nationalCode, id)) throw pendingRequestExists();
  if (!(await repo.activeBeltExists(input.beltId))) throw invalidBelt();

  const updated = await repo.updateRegistrationRequest(id, {
    fullName: input.fullName,
    nationalCode: input.nationalCode,
    birthDate: new Date(input.birthDate),
    mobile: input.mobile,
    beltCertificateDate: input.beltCertificateDate ? new Date(input.beltCertificateDate) : null,
    insuranceDate: input.insuranceDate ? new Date(input.insuranceDate) : null,
    tkdBankChargeYear: input.tkdBankChargeYear ? Number(input.tkdBankChargeYear) : null,
    beltId: input.beltId,
  });
  if (!updated) throw approvedRequestLocked();

  return updated;
}

// The province admin can correct the requested belt while the request is
// under review; after approval the belt moves through the student page.
export async function updateRegistrationRequestBelt(
  repo: StudentRepository,
  user: CurrentUser,
  id: string,
  input: UpdateStudentBeltInput,
): Promise<RegistrationRequestRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const request = await repo.findRegistrationRequestById(id);
  if (!request || request.coachProvince !== provinceOf(identity)) throw requestNotFound();
  if (!(await repo.beltExists(input.beltId))) throw invalidBelt();

  const updated = await repo.updateRegistrationRequestBelt(id, input.beltId);
  if (!updated) throw new AppError(409, "CONFLICT", "این درخواست بررسی شده است و کمربند آن قابل تغییر نیست");

  return updated;
}

export async function deleteStudent(repo: StudentRepository, storage: Storage, user: CurrentUser, id: string): Promise<{ id: string }> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentById(id);
  if (!student || student.coachId !== user.id) throw studentNotFound();

  const registrations = await repo.countRegistrations(id);
  if (registrations > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو در مسابقات ثبت نام شده است و قابل حذف نیست");
  }

  // Transfer rows are history (including rejected ones) and are never deleted.
  const transfers = await repo.countStudentTransfers(id);
  if (transfers > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو سابقه درخواست انتقال دارد و قابل حذف نیست");
  }

  const photoChanges = await repo.countStudentPhotoChangeRequests(id);
  if (photoChanges > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو سابقه درخواست تغییر عکس دارد و قابل حذف نیست");
  }

  const provinceChanges = await repo.countStudentProvinceChangeRequests(id);
  if (provinceChanges > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو سابقه درخواست تغییر استان دارد و قابل حذف نیست");
  }

  const fileIds = await repo.deleteStudent(id);
  for (const fileId of fileIds) {
    await deleteStorageFileQuietly(storage, fileId);
  }

  return { id };
}

function documentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مدرک یافت نشد");
}

export async function readStudentDocument(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  studentId: string,
  type: string,
): Promise<{ stream: ReadableStream<Uint8Array>; mime: string; size: number }> {
  const identity = await requireActiveUser(repo, user);
  if (!isStudentDocumentType(type)) throw documentNotFound();

  const student = await repo.findStudentById(studentId);
  const inScope =
    student !== null &&
    (identity.role === "SUPER_ADMIN" ||
      (identity.role === "ADMIN" ? student.coachProvince === identity.province : student.coachId === user.id));
  if (!inScope) throw studentNotFound();

  const document = await repo.findStudentDocument(studentId, type);
  if (!document) throw new AppError(404, "NOT_FOUND", "مدرکی از این نوع بارگذاری نشده است");

  const file = await storage.get(document.fileId);
  if (!file) throw new AppError(404, "NOT_FOUND", "فایل مدرک یافت نشد");

  return { stream: file.stream, mime: file.mime, size: file.size };
}

// Coaches see their own requests (all statuses); admins see their province's
// requests that still need an action, unless a status filter is given.
export async function listRegistrationRequests(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  query: RegistrationRequestListQuery,
): Promise<ListResult<RegistrationRequestWithCoach>> {
  const identity = await requireActiveUser(repo, user);

  let filters: RegistrationRequestFilters;
  if (identity.role === "COACH") {
    filters = { coachId: user.id };
  } else if (identity.role === "ADMIN") {
    filters = { province: provinceOf(identity) };
  } else if (identity.role === "SUPER_ADMIN") {
    filters = {};
  } else {
    throw forbidden();
  }

  if (query.status) {
    filters.status = query.status;
  } else if (identity.role !== "COACH") {
    filters.status = { in: ["PENDING", "REJECTED"] };
  }

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);

  const [total, requests] = await Promise.all([
    repo.countRegistrationRequests(filters),
    repo.findRegistrationRequests(filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: await withPhotoUrls(storage, requests), meta: { page, pageSize, total } };
}

export async function getRegistrationRequest(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
): Promise<RegistrationRequestRecord> {
  const identity = await requireActiveUser(repo, user);
  const request = await repo.findRegistrationRequestById(id);
  if (!request) throw requestNotFound();

  const inScope =
    identity.role === "SUPER_ADMIN" ||
    (identity.role === "ADMIN" ? request.coachProvince === provinceOf(identity) : request.coachId === user.id);
  if (!inScope) throw requestNotFound();

  const [withUrl] = await withPhotoUrls(storage, [request]);
  const { coachProvince: _province, ...record } = withUrl;
  return record;
}

// The coach uploads or replaces the personal photo of a not-yet-approved
// request; the province admin needs it before approving. On approval the
// photo becomes the student's PHOTO document.
export async function setRegistrationRequestPhoto(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  id: string,
  file: File,
): Promise<RegistrationRequestRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const request = await repo.findRegistrationRequestById(id);
  if (!request || request.coachId !== user.id) throw requestNotFound();
  if (request.status === "APPROVED") throw approvedRequestLocked();

  const image = await readProfileImage(file);
  const stored = await storage.put({ ...image, folder: "student-photos" });

  try {
    const previousFileId = await repo.setRegistrationRequestPhoto(id, stored.id);
    if (previousFileId === null) {
      throw approvedRequestLocked();
    }
    if (previousFileId) {
      await deleteStorageFileQuietly(storage, previousFileId);
    }
    return { ...request, photoFileId: stored.id };
  } catch (error) {
    await deleteStorageFileQuietly(storage, stored.id);
    throw error;
  }
}

async function decideRequest(
  repo: StudentRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  status: "APPROVED" | "REJECTED",
  note: string | null,
): Promise<RegistrationRequestRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const request = await repo.findRegistrationRequestById(id);
  if (!request || request.coachProvince !== provinceOf(identity)) throw requestNotFound();

  const decided = await repo.decideRegistrationRequest(id, { status, note, reviewedById: user.id });
  if (!decided) throw new AppError(409, "CONFLICT", "این درخواست قبلاً بررسی شده است");

  await audit.createAuditLog({
    actorId: user.id,
    action: status === "APPROVED" ? auditActions.registrationApproved : auditActions.registrationRejected,
    entityType: auditEntityTypes.registrationRequest,
    entityId: id,
    details: { coachId: request.coachId },
  });

  return decided;
}

export function approveRegistrationRequest(
  repo: StudentRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
): Promise<RegistrationRequestRecord> {
  return decideRequest(repo, audit, user, id, "APPROVED", null);
}

export function rejectRegistrationRequest(
  repo: StudentRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  note: string,
): Promise<RegistrationRequestRecord> {
  return decideRequest(repo, audit, user, id, "REJECTED", note);
}
