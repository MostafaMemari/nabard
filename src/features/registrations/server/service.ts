import type { Belt, BeltName, WeightClass } from "@/features/base-data";
import type { Province } from "@/generated/client";
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
  DeadlineExtensionStatusRow,
  ParticipantRow,
  RegistrationBundle,
  RegistrationDetailRow,
  RegistrationFilters,
  RegistrationRecord,
  RegistrationRejectionRow,
  RegistrationRepository,
  RegistrationStudentRow,
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

export type ParticipantRecord = {
  registrationId: string;
  studentId: string;
  fullName: string;
  nationalCode: string;
  birthDate: Date;
  beltName: BeltName;
  weightClassLabel: string | null;
  coachName: string;
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

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
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
    profileStatus: row.profileStatus,
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
    return { province: provinceOf(identity), coachId: query.coachId, ...shared };
  }

  if (identity.role === "SUPER_ADMIN") {
    return { province: query.province, coachId: query.coachId, ...shared };
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

  const inScope =
    identity.role === "SUPER_ADMIN" || (identity.role === "ADMIN" ? row.coachProvince === provinceOf(identity) : row.coachId === user.id);
  if (!inScope) throw registrationNotFound();

  return toRegistrationRecord(row);
}

export async function getRegistrationDetail(repo: RegistrationRepository, user: CurrentUser, id: string): Promise<RegistrationDetailRow> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findRegistrationDetailById(id);
  if (!row) throw registrationNotFound();

  const inScope =
    identity.role === "SUPER_ADMIN" ||
    (identity.role === "ADMIN" ? row.registration.coachProvince === provinceOf(identity) : row.registration.coachId === user.id);
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

const DUPLICATE_REASON = "این هنرجو قبلا در این مسابقه ثبت نام شده است.";
const REJECTED_NOT_REOPENED_REASON = "ثبت نام قبلی این هنرجو رد شده و مهلت جدیدی برای ثبت نام مجدد او باز نشده است.";

function registrationProblems(
  students: RegistrationStudentRow[],
  activeIds: string[],
  rejections: RegistrationRejectionRow[],
  extension: DeadlineExtensionStatusRow | null,
): RegistrationProblem[] {
  const problems: RegistrationProblem[] = [];
  for (const student of students) {
    if (activeIds.includes(student.id)) {
      problems.push({ studentId: student.id, fullName: student.fullName, reason: DUPLICATE_REASON });
      continue;
    }

    const rejection = rejections.find((row) => row.studentId === student.id);
    if (rejection === undefined) continue;

    const reopened = extension?.reopenForRejected === true && extension.createdAt.getTime() > rejection.rejectedAt.getTime();
    if (!reopened) {
      problems.push({ studentId: student.id, fullName: student.fullName, reason: REJECTED_NOT_REOPENED_REASON });
    }
  }

  return problems;
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

  if (competition.level === "COUNTY" && competition.hostCountyId !== identity.countyId) {
    throw new AppError(403, "FORBIDDEN", "ثبت نام در این مسابقه فقط برای مربیان شهرستان میزبان امکان پذیر است.");
  }

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

  const [belts, weightClasses, activeIds, rejections] = await Promise.all([
    repo.findAllBelts(),
    repo.findWeightClasses(competition.ageCategoryId, competition.gender),
    repo.findActiveRegisteredStudentIds(competitionId, uniqueIds),
    repo.findLatestRejectionsByStudentIds(competitionId, uniqueIds),
  ]);

  const extension = rejections.length > 0 ? await repo.findLatestDeadlineExtension(competitionId) : null;

  const problems = registrationProblems(students, activeIds, rejections, extension);
  if (problems.length > 0) {
    throw new AppError(409, "CONFLICT", "برای برخی از هنرجوهای انتخاب شده امکان ثبت نام در این مسابقه نیست.", problems);
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

function compareParticipantRows(a: ParticipantRow, b: ParticipantRow): number {
  const orderA = a.weightClass?.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.weightClass?.order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;

  return a.student.fullName.localeCompare(b.student.fullName, "fa");
}

function toParticipantRecord(row: ParticipantRow): ParticipantRecord {
  return {
    registrationId: row.id,
    studentId: row.student.id,
    fullName: row.student.fullName,
    nationalCode: row.student.nationalCode,
    birthDate: row.student.birthDate,
    beltName: row.student.beltName,
    weightClassLabel: row.weightClass?.label ?? null,
    coachName: row.coachName,
  };
}

export async function listParticipants(
  repo: RegistrationRepository,
  user: CurrentUser,
  competitionId: string,
): Promise<ParticipantRecord[]> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role === "COACH") throw forbidden();

  const competition = await repo.findCompetitionById(competitionId);
  if (!competition) throw competitionNotFound();
  if (identity.role !== "SUPER_ADMIN" && competition.province !== provinceOf(identity)) throw competitionNotFound();

  const rows = await repo.findApprovedParticipants(competitionId);

  return [...rows].sort(compareParticipantRows).map(toParticipantRecord);
}

async function transitionRegistration(
  repo: RegistrationRepository,
  user: CurrentUser,
  id: string,
  input: { status: "APPROVED" | "REJECTED"; note: string | null },
): Promise<RegistrationRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const current = await repo.findRegistrationById(id);
  if (!current || current.coachProvince !== identity.province) throw registrationNotFound();

  const result = await repo.transitionRegistrationFromPending(id, {
    status: input.status,
    note: input.note,
    createRefund: input.status === "REJECTED" && current.paymentStatus === "CONFIRMED",
  });
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
