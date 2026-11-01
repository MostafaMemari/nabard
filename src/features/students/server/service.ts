import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { CreateStudentInput, StudentListQuery, UpdateStudentInput } from "../schemas";
import type {
  NewStudentData,
  StudentFilters,
  StudentRecord,
  StudentRepository,
  StudentUpdateData,
  StudentWithCoach,
  UserIdentityRecord,
} from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function studentNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "هنرجو یافت نشد.");
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
    return { province: identity.province, coachId: query.coachId, ...shared };
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

export async function getStudent(repo: StudentRepository, user: CurrentUser, id: string): Promise<StudentRecord> {
  const identity = await requireActiveUser(repo, user);
  const student = await repo.findStudentById(id);
  if (!student) throw studentNotFound();

  const inScope = identity.role === "ADMIN" ? student.coachProvince === identity.province : student.coachId === user.id;
  if (!inScope) throw studentNotFound();

  return toStudentRecord(student);
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

  const data: StudentUpdateData = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.nationalCode !== undefined) data.nationalCode = input.nationalCode;
  if (input.birthDate !== undefined) data.birthDate = new Date(input.birthDate);
  if (input.weightKg !== undefined) data.weightKg = input.weightKg;
  if (input.beltId !== undefined) data.beltId = input.beltId;

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
