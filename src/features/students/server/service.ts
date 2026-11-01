import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { readReceiptImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { CreateStudentInput, PendingReviewQuery, StudentListQuery, UpdateStudentInput } from "../schemas";
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
  StudentUpdateData,
  StudentWithCoach,
  UserIdentityRecord,
} from "./repository";
import { isStudentDocumentType } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

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
    weightKg: student.weightKg,
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
  user: CurrentUser,
  query: StudentListQuery,
): Promise<ListResult<StudentRecord>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(user, identity, query);

  const [total, students] = await Promise.all([repo.countStudents(filters), repo.findStudents(filters, (page - 1) * pageSize, pageSize)]);

  return { data: students, meta: { page, pageSize, total } };
}

export async function getStudent(repo: StudentRepository, user: CurrentUser, id: string): Promise<StudentDetail> {
  const identity = await requireActiveUser(repo, user);
  const student = await repo.findStudentById(id);
  if (!student) throw studentNotFound();

  const inScope =
    identity.role === "SUPER_ADMIN" ||
    (identity.role === "ADMIN" ? student.coachProvince === provinceOf(identity) : student.coachId === user.id);
  if (!inScope) throw studentNotFound();

  const documents = await repo.findStudentDocuments(id);

  return { ...toStudentRecord(student), coachName: student.coachName, documents };
}

export async function createStudent(repo: StudentRepository, user: CurrentUser, input: CreateStudentInput): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  if (!(await repo.beltExists(input.beltId))) throw invalidBelt();

  const owner = await repo.findNationalCodeOwner(input.nationalCode);
  if (owner) throw duplicateNationalCode();

  const data: NewStudentData = {
    fullName: input.fullName,
    gender: input.gender,
    nationalCode: input.nationalCode,
    birthDate: new Date(input.birthDate),
    weightKg: input.weightKg ?? null,
    beltId: input.beltId,
    coachId: user.id,
  };

  return repo.createStudent(data);
}

export async function updateStudent(
  repo: StudentRepository,
  user: CurrentUser,
  id: string,
  input: UpdateStudentInput,
): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentById(id);
  if (!student || student.coachId !== user.id) throw studentNotFound();

  if (input.nationalCode !== undefined) {
    const owner = await repo.findNationalCodeOwner(input.nationalCode);
    if (owner && owner.id !== id) throw duplicateNationalCode();
  }

  if (input.beltId !== undefined && !(await repo.beltExists(input.beltId))) throw invalidBelt();

  const identityChanged =
    (input.fullName !== undefined && input.fullName !== student.fullName) ||
    (input.nationalCode !== undefined && input.nationalCode !== student.nationalCode) ||
    (input.birthDate !== undefined && new Date(input.birthDate).getTime() !== student.birthDate.getTime()) ||
    (input.beltId !== undefined && input.beltId !== student.beltId);

  const data: StudentUpdateData = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.nationalCode !== undefined) data.nationalCode = input.nationalCode;
  if (input.birthDate !== undefined) data.birthDate = new Date(input.birthDate);
  if (input.weightKg !== undefined) data.weightKg = input.weightKg;
  if (input.beltId !== undefined) data.beltId = input.beltId;

  if (identityChanged && student.profileStatus === "APPROVED") {
    data.profileStatus = "PENDING";
  }

  return repo.updateStudent(id, data);
}

export async function deleteStudent(repo: StudentRepository, user: CurrentUser, id: string): Promise<{ id: string }> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const student = await repo.findStudentById(id);
  if (!student || student.coachId !== user.id) throw studentNotFound();

  const registrations = await repo.countRegistrations(id);
  if (registrations > 0) {
    throw new AppError(409, "CONFLICT", "این هنرجو در مسابقات ثبت نام شده است و قابل حذف نیست.");
  }

  await repo.deleteStudent(id);

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

  const image = await readReceiptImage(file);
  const stored = await storage.put(image);

  return repo.upsertStudentDocument(studentId, type, stored.id);
}

export async function readStudentDocument(
  repo: StudentRepository,
  storage: Storage,
  user: CurrentUser,
  studentId: string,
  type: string,
): Promise<{ data: Uint8Array; mime: string }> {
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

  return { data: file.data, mime: file.mime };
}

export async function deleteStudentDocument(
  repo: StudentRepository,
  user: CurrentUser,
  studentId: string,
  type: string,
): Promise<{ type: StudentDocumentType }> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();
  if (!isStudentDocumentType(type)) throw documentNotFound();
  await requireOwnedStudent(repo, user, studentId);

  const deleted = await repo.deleteStudentDocumentWithFile(studentId, type);
  if (!deleted) throw documentNotFound();

  return { type };
}

export async function listPendingReviewStudents(
  repo: StudentRepository,
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

  return { data: students, meta: { page, pageSize, total } };
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
