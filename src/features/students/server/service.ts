import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { deleteStorageFileQuietly } from "@/lib/storage";
import { readProfileImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { CreateStudentInput, PendingReviewQuery, StudentListQuery, UpdateStudentBeltInput } from "../schemas";
import type {
  NewStudentData,
  PendingReviewFilters,
  PendingReviewStudent,
  StudentDetail,
  StudentDocumentRecord,
  StudentDocumentType,
  StudentFilters,
  StudentRecord,
  StudentRepository,
  StudentWithCoach,
  UserIdentityRecord,
} from "./repository";
import { isStudentDocumentType } from "./repository";

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_BELT_CODE = "white";

// Photos live in R2 and are displayed straight from its public endpoint:
// no signature and no backend hop. When a file url cannot be resolved
// (local development without the public endpoint) the photo url is null and
// the UI shows the fallback avatar. The internal file id is stripped from
// the response payload.
async function withPhotoUrls<T extends { id: string; photoFileId?: string | null }>(
  storage: Storage,
  records: T[],
): Promise<Omit<T, "photoFileId">[]> {
  if (records.length === 0) return records;

  const fileIds = records.map((record) => record.photoFileId).filter((fileId): fileId is string => Boolean(fileId));
  const urls = await storage.getUrls(fileIds);

  return records.map((record) => {
    const { photoFileId, ...rest } = record;
    return {
      ...rest,
      ...(photoFileId ? { photoUrl: urls.get(photoFileId) ?? null } : {}),
    };
  });
}

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function studentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "هنرجو یافت نشد.");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

function duplicateNationalCode(): AppError {
  return new AppError(409, "CONFLICT", "این کد ملی قبلاً ثبت شده است.");
}

function invalidBelt(): AppError {
  return new AppError(400, "VALIDATION_ERROR", "کمربند انتخاب شده معتبر نیست.");
}

function defaultBeltMissing(): AppError {
  return new AppError(400, "VALIDATION_ERROR", "کمربند پیش فرض یافت نشد؛ با ادمین استان تماس بگیرید.");
}

function coachGenderMissing(): AppError {
  return new AppError(400, "VALIDATION_ERROR", "جنسیت شما ثبت نشده است؛ با ادمین استان تماس بگیرید.");
}

async function requireActiveUser(repo: StudentRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
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
    insuranceDate: student.insuranceDate,
    tkdBankChargeDate: student.tkdBankChargeDate,
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
  const photoDocument = documents.find((document) => document.type === "PHOTO");
  const urls = photoDocument ? await storage.getUrls([photoDocument.fileId]) : new Map<string, string>();

  return {
    ...toStudentRecord(student),
    coachName: student.coachName,
    documents,
    ...(photoDocument ? { photoUrl: urls.get(photoDocument.fileId) ?? null } : {}),
  };
}

export async function createStudent(repo: StudentRepository, user: CurrentUser, input: CreateStudentInput): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!identity.gender) throw coachGenderMissing();

  if (await repo.findNationalCodeOwner(input.nationalCode)) throw duplicateNationalCode();

  const beltId = await repo.findBeltIdByCode(DEFAULT_BELT_CODE);
  if (!beltId) throw defaultBeltMissing();

  const data: NewStudentData = {
    fullName: input.fullName,
    gender: identity.gender,
    nationalCode: input.nationalCode,
    birthDate: new Date(input.birthDate),
    insuranceDate: input.insuranceDate ? new Date(input.insuranceDate) : null,
    tkdBankChargeDate: input.tkdBankChargeDate ? new Date(input.tkdBankChargeDate) : null,
    beltId,
    coachId: user.id,
  };

  return repo.createStudent(data);
}

// After registration the student profile is locked; the province admin can
// only move the student between belts.
export async function updateStudentBelt(
  repo: StudentRepository,
  user: CurrentUser,
  id: string,
  input: UpdateStudentBeltInput,
): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const student = await repo.findStudentById(id);
  if (!student || student.coachProvince !== provinceOf(identity)) throw studentNotFound();
  if (!(await repo.beltExists(input.beltId))) throw invalidBelt();

  return repo.updateStudent(id, { beltId: input.beltId });
}

export async function deleteStudent(repo: StudentRepository, storage: Storage, user: CurrentUser, id: string): Promise<{ id: string }> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentById(id);
  if (!student || student.coachId !== user.id) throw studentNotFound();

  const registrations = await repo.countRegistrations(id);
  if (registrations > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو در مسابقات ثبت نام شده است و قابل حذف نیست.");
  }

  // Transfer rows are history (including rejected ones) and are never deleted.
  const transfers = await repo.countStudentTransfers(id);
  if (transfers > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو سابقه درخواست انتقال دارد و قابل حذف نیست.");
  }

  const fileIds = await repo.deleteStudent(id);
  for (const fileId of fileIds) {
    await deleteStorageFileQuietly(storage, fileId);
  }

  return { id };
}

function documentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مدرک یافت نشد.");
}

async function requireOwnedStudent(repo: StudentRepository, user: CurrentUser, studentId: string): Promise<void> {
  const student = await repo.findStudentById(studentId);
  if (!student || student.coachId !== user.id) throw studentNotFound();
}

export async function uploadStudentDocument(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  studentId: string,
  type: string,
  file: File,
): Promise<StudentDocumentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!isStudentDocumentType(type)) throw documentNotFound();
  await requireOwnedStudent(repo, user, studentId);

  const image = await readProfileImage(file);
  const existing = await repo.findStudentDocument(studentId, type);
  const stored = await storage.put({ ...image, folder: "student-photos" });

  try {
    const record = await repo.upsertStudentDocument(studentId, type, stored.id);
    if (existing && existing.fileId !== stored.id) {
      await deleteStorageFileQuietly(storage, existing.fileId);
    }

    return record;
  } catch (error) {
    await deleteStorageFileQuietly(storage, stored.id);
    throw error;
  }
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
  if (!document) throw new AppError(404, "NOT_FOUND", "مدرکی از این نوع بارگذاری نشده است.");

  const file = await storage.get(document.fileId);
  if (!file) throw new AppError(404, "NOT_FOUND", "فایل مدرک یافت نشد.");

  return { stream: file.stream, mime: file.mime, size: file.size };
}

export async function deleteStudentDocument(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  studentId: string,
  type: string,
): Promise<{ type: StudentDocumentType }> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!isStudentDocumentType(type)) throw documentNotFound();
  await requireOwnedStudent(repo, user, studentId);

  const deleted = await repo.deleteStudentDocument(studentId, type);
  if (!deleted) throw documentNotFound();

  await deleteStorageFileQuietly(storage, deleted.fileId);

  return { type };
}

export async function listPendingReviewStudents(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  query: PendingReviewQuery,
): Promise<ListResult<PendingReviewStudent>> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters: PendingReviewFilters = { province: provinceOf(identity), status: query.status };

  const [total, students] = await Promise.all([
    repo.countPendingReviewStudents(filters),
    repo.findPendingReviewStudents(filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: await withPhotoUrls(storage, students), meta: { page, pageSize, total } };
}

async function reviewProfile(
  repo: StudentRepository,
  user: CurrentUser,
  id: string,
  status: "APPROVED" | "REJECTED",
  note: string | null,
): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const student = await repo.findStudentById(id);
  if (!student || student.coachProvince !== provinceOf(identity)) throw studentNotFound();

  const updated = await repo.updateProfileStatusFromPendingOrRejected(id, { status, note, reviewedById: user.id });
  if (!updated) throw new AppError(409, "CONFLICT", "این پروفایل قبلا بررسی شده است.");

  return updated;
}

export function approveStudentProfile(repo: StudentRepository, user: CurrentUser, id: string): Promise<StudentRecord> {
  return reviewProfile(repo, user, id, "APPROVED", null);
}

export function rejectStudentProfile(repo: StudentRepository, user: CurrentUser, id: string, note: string): Promise<StudentRecord> {
  return reviewProfile(repo, user, id, "REJECTED", note);
}
