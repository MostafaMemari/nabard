import type { Belt, WeightClass } from "@/features/base-data";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { readReceiptImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { RegistrationListQuery } from "../schemas";
import { checkEligibility, type EligibilityCompetition, type EligibilityStudent } from "./eligibility";
import type {
  AgeCategoryRow,
  CompetitionRegistrationRow,
  RegistrationBundle,
  RegistrationDetailRow,
  RegistrationFilters,
  RegistrationRecord,
  RegistrationRepository,
  RegistrationStudentRow,
  RegistrationTransitionInput,
  RegistrationWithScope,
  UserIdentityRecord,
} from "./repository";

export type CreateRegistrationsInput = {
  studentIds: string[];
  receipt: File;
};

export type RegistrationProblem = {
  studentId: string;
  fullName: string;
  reason: string;
};

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function registrationNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "ثبت نام یافت نشد.");
}

function competitionNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مسابقه یافت نشد.");
}

async function requireActiveUser(repo: RegistrationRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function expandBeltIds(row: { minBeltId: string; maxBeltId: string }, belts: Belt[]): string[] {
  const minLevel = belts.find((belt) => belt.id === row.minBeltId)?.level ?? 0;
  const maxLevel = belts.find((belt) => belt.id === row.maxBeltId)?.level ?? 0;

  return belts.filter((belt) => belt.level >= minLevel && belt.level <= maxLevel).map((belt) => belt.id);
}

function toEligibilityStudent(row: RegistrationStudentRow): EligibilityStudent {
  return {
    id: row.id,
    fullName: row.fullName,
    gender: row.gender,
    birthDate: row.birthDate.toISOString(),
    beltId: row.beltId,
    weightKg: row.weightKg,
  };
}

function toEligibilityCompetition(
  row: CompetitionRegistrationRow,
  ageCategory: AgeCategoryRow,
  belts: Belt[],
  weightClasses: WeightClass[],
): EligibilityCompetition {
  return {
    discipline: row.discipline,
    gender: row.gender,
    ageCategory: {
      id: ageCategory.id,
      name: ageCategory.name,
      startDate: ageCategory.startDate.toISOString(),
      endDate: ageCategory.endDate.toISOString(),
      birthYearStart: null,
      birthYearEnd: null,
    },
    beltIds: expandBeltIds(row, belts),
    weightClasses: row.discipline === "KYORUGI" ? weightClasses : [],
  };
}

function toRegistrationRecord(row: RegistrationWithScope): RegistrationRecord {
  return {
    id: row.id,
    competitionId: row.competitionId,
    studentId: row.studentId,
    coachId: row.coachId,
    paymentId: row.paymentId,
    weightClassId: row.weightClassId,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    student: row.student,
  };
}

function toFilters(user: CurrentUser, identity: UserIdentityRecord, query: RegistrationListQuery): RegistrationFilters {
  const shared = {
    competitionId: query.competitionId,
    paymentId: query.paymentId,
    status: query.status,
  };

  if (identity.role === "ADMIN") {
    return { province: identity.province, coachId: query.coachId, ...shared };
  }

  return { coachId: user.id, ...shared };
}

export async function listRegistrations(
  repo: RegistrationRepository,
  user: CurrentUser,
  query: RegistrationListQuery,
): Promise<ListResult<RegistrationRecord>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(user, identity, query);

  const [total, rows] = await Promise.all([
    repo.countRegistrations(filters),
    repo.findRegistrations(filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: rows.map(toRegistrationRecord), meta: { page, pageSize, total } };
}

export async function getRegistration(repo: RegistrationRepository, user: CurrentUser, id: string): Promise<RegistrationRecord> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findRegistrationById(id);
  if (!row) throw registrationNotFound();

  const inScope = identity.role === "ADMIN" ? row.coachProvince === identity.province : row.coachId === user.id;
  if (!inScope) throw registrationNotFound();

  return toRegistrationRecord(row);
}

export async function getRegistrationDetail(repo: RegistrationRepository, user: CurrentUser, id: string): Promise<RegistrationDetailRow> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findRegistrationDetailById(id);
  if (!row) throw registrationNotFound();

  const inScope = identity.role === "ADMIN" ? row.registration.coachProvince === identity.province : row.registration.coachId === user.id;
  if (!inScope) throw registrationNotFound();

  return row;
}

function assertRegistrationWindow(competition: CompetitionRegistrationRow, now: Date): void {
  if (competition.status !== "PUBLISHED") {
    throw new AppError(409, "CONFLICT", "ثبت نام در این مسابقه فعال نیست.");
  }

  if (now.getTime() < competition.createdAt.getTime()) {
    throw new AppError(409, "CONFLICT", "زمان ثبت نام این مسابقه هنوز آغاز نشده است.");
  }

  if (now.getTime() > competition.registrationDeadline.getTime()) {
    throw new AppError(409, "CONFLICT", "مهلت ثبت نام این مسابقه به پایان رسیده است.");
  }
}

export async function createRegistrations(
  repo: RegistrationRepository,
  storage: Storage,
  user: CurrentUser,
  competitionId: string,
  input: CreateRegistrationsInput,
): Promise<RegistrationBundle> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "COACH") throw forbidden();

  const competition = await repo.findCompetitionById(competitionId);
  if (!competition || competition.province !== identity.province) throw competitionNotFound();

  assertRegistrationWindow(competition, new Date());

  const receipt = await readReceiptImage(input.receipt);

  const uniqueIds = [...new Set(input.studentIds)];
  const students = await repo.findCoachStudentsByIds(user.id, uniqueIds);
  if (students.length !== uniqueIds.length) {
    throw new AppError(403, "FORBIDDEN", "فقط می توانید برای هنرجوهای خودتان ثبت نام کنید.");
  }

  const ageCategory = await repo.findAgeCategoryById(competition.ageCategoryId);
  if (!ageCategory) {
    throw new AppError(409, "CONFLICT", "رده سنی این مسابقه معتبر نیست.");
  }

  const [belts, weightClasses, registeredIds] = await Promise.all([
    repo.findAllBelts(),
    repo.findWeightClasses(competition.ageCategoryId, competition.gender),
    repo.findRegisteredStudentIds(competitionId, uniqueIds),
  ]);

  const duplicates = students.filter((student) => registeredIds.includes(student.id));
  if (duplicates.length > 0) {
    const problems = duplicates.map((student) => ({
      studentId: student.id,
      fullName: student.fullName,
      reason: "این هنرجو قبلا در این مسابقه ثبت نام شده است.",
    }));

    throw new AppError(409, "CONFLICT", "برای برخی از هنرجوهای انتخاب شده قبلا در این مسابقه ثبت نام شده است.", problems);
  }

  const eligibilityCompetition = toEligibilityCompetition(competition, ageCategory, belts, weightClasses);
  const results = students.map((student) => ({
    student,
    eligibility: checkEligibility(toEligibilityStudent(student), eligibilityCompetition, belts),
  }));

  const ineligible = results.filter((result) => !result.eligibility.eligible);
  if (ineligible.length > 0) {
    const problems = ineligible.map((result) => ({
      studentId: result.student.id,
      fullName: result.student.fullName,
      reason: result.eligibility.eligible ? "" : result.eligibility.reason,
    }));

    throw new AppError(400, "VALIDATION_ERROR", "برخی از هنرجوهای انتخاب شده واجد شرایط ثبت نام در این مسابقه نیستند.", problems);
  }

  const stored = await storage.put(receipt);
  const studentsToRegister = results.map((result) => ({
    studentId: result.student.id,
    weightClassId: result.eligibility.eligible ? (result.eligibility.weightClass?.id ?? null) : null,
  }));

  return repo.createRegistrationBundle({
    competitionId,
    coachId: user.id,
    amount: competition.feePerStudent * BigInt(studentsToRegister.length),
    receiptKey: stored.id,
    students: studentsToRegister,
  });
}

async function transitionRegistration(
  repo: RegistrationRepository,
  user: CurrentUser,
  id: string,
  input: RegistrationTransitionInput,
): Promise<RegistrationRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findRegistrationById(id);
  if (!current || current.coachProvince !== identity.province) throw registrationNotFound();

  const result = await repo.transitionRegistrationFromPending(id, input);
  if (result === null) throw registrationNotFound();
  if (result.kind === "updated") return toRegistrationRecord(result.row);
  if (result.reason === "REVIEWED") {
    throw new AppError(409, "CONFLICT", "این ثبت نام قبلا بررسی شده است.");
  }
  throw new AppError(409, "CONFLICT", "برای بررسی ثبت نام، ابتدا رسید پرداخت باید تایید شود.");
}

export async function approveRegistration(repo: RegistrationRepository, user: CurrentUser, id: string): Promise<RegistrationRecord> {
  return transitionRegistration(repo, user, id, { status: "APPROVED", note: null });
}

export async function rejectRegistration(
  repo: RegistrationRepository,
  user: CurrentUser,
  id: string,
  note: string,
): Promise<RegistrationRecord> {
  return transitionRegistration(repo, user, id, { status: "REJECTED", note });
}
