import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { deleteStorageFileQuietly } from "@/lib/storage";
import type { Storage } from "@/lib/storage/types";
import type { CreateStudentInput, PendingReviewQuery, StudentListQuery, UpdateStudentBeltInput } from "../schemas";
import type {
  NewStudentData,
  PendingReviewFilters,
  PendingReviewStudent,
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

function duplicateNationalCode(): AppError {
  return new AppError(409, "CONFLICT", "این کد ملی قبلاً ثبت شده است");
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
    tkdBankChargeDate: student.tkdBankChargeDate,
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

export async function createStudent(repo: StudentRepository, user: CurrentUser, input: CreateStudentInput): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!identity.gender) throw coachGenderMissing();

  if (await repo.findNationalCodeOwner(input.nationalCode)) throw duplicateNationalCode();
  if (!(await repo.activeBeltExists(input.beltId))) throw invalidBelt();

  const data: NewStudentData = {
    fullName: input.fullName,
    gender: identity.gender,
    nationalCode: input.nationalCode,
    birthDate: new Date(input.birthDate),
    mobile: input.mobile,
    beltCertificateDate: input.beltCertificateDate ? new Date(input.beltCertificateDate) : null,
    insuranceDate: input.insuranceDate ? new Date(input.insuranceDate) : null,
    tkdBankChargeDate: input.tkdBankChargeDate ? new Date(input.tkdBankChargeDate) : null,
    beltId: input.beltId,
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

  // One batched url lookup for every photo and document on the page.
  const urls = await resolveFileUrls(
    storage,
    students.flatMap((student) => [student.photoFileId, ...student.documents.map((document) => document.fileId)]),
  );

  return {
    data: students.map((student) => {
      const { photoFileId, ...rest } = student;
      return {
        ...rest,
        documents: documentsWithUrls(student.documents, urls),
        ...(photoFileId ? { photoUrl: urls.get(photoFileId) ?? null } : {}),
      };
    }),
    meta: { page, pageSize, total },
  };
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
  if (!updated) throw new AppError(409, "CONFLICT", "این پروفایل قبلا بررسی شده است");

  return updated;
}

export function approveStudentProfile(repo: StudentRepository, user: CurrentUser, id: string): Promise<StudentRecord> {
  return reviewProfile(repo, user, id, "APPROVED", null);
}

export function rejectStudentProfile(repo: StudentRepository, user: CurrentUser, id: string, note: string): Promise<StudentRecord> {
  return reviewProfile(repo, user, id, "REJECTED", note);
}
