import type { Belt, Gender, WeightClass } from "@/features/base-data";
import {
  checkEligibility,
  type EligibilityCompetition,
  type EligibilityStudent,
  eligibilityCompetitionFromSnapshot,
} from "@/features/registrations/server/eligibility";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { CompetitionListQuery, CreateCompetitionInput, UpdateCompetitionInput } from "../schemas";
import type {
  CompetitionLevel,
  CompetitionRegistrationState,
  CompetitionRulesSnapshot,
  Discipline,
  ExtendCompetitionInput,
} from "../types";
import type {
  AgeCategoryRow,
  CompetitionFilters,
  CompetitionRow,
  CompetitionsRepository,
  DeadlineExtensionRow,
  NewCompetitionData,
  UserIdentityRecord,
} from "./repository";

const DEFAULT_PAGE_SIZE = 100;

export type CompetitionRecord = {
  id: string;
  title: string;
  province: string;
  level: CompetitionLevel;
  countyIds: string[];
  countyNames: string[];
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  ageCategoryLabel: string;
  beltIds: string[];
  feePerStudent: string;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: Date;
  eventDate: Date;
  status: CompetitionStatusOf;
  rules: CompetitionRulesSnapshot | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CompetitionStatusOf = "DRAFT" | "PUBLISHED" | "CANCELED";

export type CompetitionView = CompetitionRecord & {
  state?: CompetitionRegistrationState;
  eligibleStudentCount?: number;
};

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function competitionNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مسابقه یافت نشد.");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

async function requireActiveUser(repo: CompetitionsRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

export function registrationState(now: Date, competition: { createdAt: Date; registrationDeadline: Date }): CompetitionRegistrationState {
  const time = now.getTime();
  if (time < competition.createdAt.getTime()) return "NOT_YET_OPEN";
  if (time <= competition.registrationDeadline.getTime()) return "OPEN";
  return "CLOSED";
}

function expandBeltIds(row: { minBeltId: string; maxBeltId: string }, belts: Belt[]): string[] {
  const minLevel = belts.find((belt) => belt.id === row.minBeltId)?.level ?? 0;
  const maxLevel = belts.find((belt) => belt.id === row.maxBeltId)?.level ?? 0;

  return belts.filter((belt) => belt.level >= minLevel && belt.level <= maxLevel).map((belt) => belt.id);
}

function toRecord(row: CompetitionRow, belts: Belt[], categories: AgeCategoryRow[]): CompetitionRecord {
  const ageCategoryLabel = row.rules?.ageCategory.label ?? categories.find((category) => category.id === row.ageCategoryId)?.label ?? "";

  return {
    id: row.id,
    title: row.title,
    province: row.province,
    level: row.level,
    countyIds: row.countyIds,
    countyNames: row.countyNames,
    discipline: row.discipline,
    gender: row.gender,
    ageCategoryId: row.ageCategoryId,
    ageCategoryLabel,
    beltIds: expandBeltIds(row, belts),
    feePerStudent: row.feePerStudent.toString(),
    payeeCardNumber: row.payeeCardNumber,
    payeeCardHolder: row.payeeCardHolder,
    registrationDeadline: row.registrationDeadline,
    eventDate: row.eventDate,
    status: row.status,
    rules: row.rules,
    cancelReason: row.cancelReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type MergedCompetitionData = {
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  beltIds: string[];
  registrationDeadline: Date;
  eventDate: Date;
};

async function resolveBeltRange(
  repo: CompetitionsRepository,
  beltIds: string[],
): Promise<{ belts: Belt[]; minBeltId: string; maxBeltId: string }> {
  const belts = await repo.findAllBelts();
  const levels: number[] = [];
  for (const beltId of beltIds) {
    const belt = belts.find((item) => item.id === beltId);
    if (!belt) throw new AppError(400, "VALIDATION_ERROR", "کمربندهای انتخاب شده معتبر نیستند.");
    levels.push(belt.level);
  }

  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  if (minLevel > maxLevel) {
    throw new AppError(400, "VALIDATION_ERROR", "سطح کمربند ابتدا باید کمتر یا مساوی سطح کمربند انتها باشد.");
  }

  const minBelt = belts.find((belt) => belt.level === minLevel);
  const maxBelt = belts.find((belt) => belt.level === maxLevel);

  return { belts, minBeltId: minBelt?.id ?? "", maxBeltId: maxBelt?.id ?? "" };
}

async function validateCounties(repo: CompetitionsRepository, province: string, countyIds: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(countyIds)];
  if (uniqueIds.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "حداقل یک شهرستان را انتخاب کنید.");
  }

  const counties: string[] = [];
  for (const countyId of uniqueIds) {
    const county = await repo.findCountyById(countyId);
    if (!county || county.province !== province) {
      throw new AppError(400, "VALIDATION_ERROR", "شهرستان های انتخاب شده معتبر نیستند.");
    }

    counties.push(county.id);
  }

  return counties;
}

async function validateCompetitionData(
  repo: CompetitionsRepository,
  data: MergedCompetitionData,
): Promise<{ belts: Belt[]; minBeltId: string; maxBeltId: string; categories: AgeCategoryRow[] }> {
  const range = await resolveBeltRange(repo, data.beltIds);

  const categories = await repo.findAllAgeCategories();
  if (!categories.some((category) => category.id === data.ageCategoryId)) {
    throw new AppError(400, "VALIDATION_ERROR", "رده سنی انتخاب شده معتبر نیست.");
  }

  if (data.eventDate.getTime() <= data.registrationDeadline.getTime()) {
    throw new AppError(400, "VALIDATION_ERROR", "تاریخ برگزاری باید بعد از مهلت ثبت نام باشد.");
  }

  if (data.discipline === "KYORUGI") {
    const weightClasses = await repo.findWeightClasses(data.ageCategoryId, data.gender);
    if (weightClasses.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "برای این رده سنی و جنسیت رده وزنی تعریف نشده است.");
    }
  }

  return { ...range, categories };
}

function toEligibilityStudent(row: {
  id: string;
  fullName: string;
  gender: EligibilityStudent["gender"];
  birthDate: Date;
  beltId: string;
  weightKg: number | null;
  profileStatus: EligibilityStudent["profileStatus"];
}): EligibilityStudent {
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
  row: CompetitionRow,
  belts: Belt[],
  categories: AgeCategoryRow[],
  weightClasses: WeightClass[],
): EligibilityCompetition | null {
  if (row.rules) {
    return eligibilityCompetitionFromSnapshot({ discipline: row.discipline, gender: row.gender }, row.rules, belts);
  }

  const ageCategory = categories.find((category) => category.id === row.ageCategoryId);
  if (!ageCategory) return null;

  return {
    discipline: row.discipline,
    gender: row.gender,
    ageCategory: {
      id: ageCategory.id,
      code: ageCategory.code,
      label: ageCategory.label,
      startDate: ageCategory.startDate.toISOString(),
      endDate: ageCategory.endDate.toISOString(),
      birthYearStart: ageCategory.birthYearStart,
      birthYearEnd: ageCategory.birthYearEnd,
      isActive: ageCategory.isActive,
    },
    beltIds: expandBeltIds(row, belts),
    weightClasses:
      row.discipline === "KYORUGI"
        ? weightClasses.filter((item) => item.ageCategoryId === row.ageCategoryId && item.gender === row.gender)
        : [],
  };
}

async function decorateForCoach(
  repo: CompetitionsRepository,
  coachId: string,
  row: CompetitionRow,
  belts: Belt[],
): Promise<{ state: CompetitionRegistrationState; eligibleStudentCount: number }> {
  const [students, categories, weightClasses] = await Promise.all([
    repo.findCoachStudents(coachId),
    repo.findAllAgeCategories(),
    repo.findWeightClasses(row.ageCategoryId, row.gender),
  ]);

  const competition = toEligibilityCompetition(row, belts, categories, weightClasses);
  const eligible =
    competition === null
      ? 0
      : students.filter((student) => checkEligibility(toEligibilityStudent(student), competition, belts).eligible).length;

  return { state: registrationState(new Date(), row), eligibleStudentCount: eligible };
}

export async function listCompetitions(
  repo: CompetitionsRepository,
  user: CurrentUser,
  query: CompetitionListQuery,
): Promise<ListResult<CompetitionView>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const search = query.search?.trim() || undefined;

  if (identity.role === "SUPER_ADMIN") {
    const filters: CompetitionFilters = {
      province: query.province,
      status: query.status,
      discipline: query.discipline,
      search,
    };

    const [total, rows, belts, categories] = await Promise.all([
      repo.countCompetitions(filters),
      repo.findCompetitions(filters, (page - 1) * pageSize, pageSize, "createdAtDesc"),
      repo.findAllBelts(),
      repo.findAllAgeCategories(),
    ]);

    return { data: rows.map((row) => toRecord(row, belts, categories)), meta: { page, pageSize, total } };
  }

  if (identity.role === "ADMIN") {
    const filters: CompetitionFilters = {
      province: provinceOf(identity),
      status: query.status,
      discipline: query.discipline,
      search,
    };

    const [total, rows, belts, categories] = await Promise.all([
      repo.countCompetitions(filters),
      repo.findCompetitions(filters, (page - 1) * pageSize, pageSize, "createdAtDesc"),
      repo.findAllBelts(),
      repo.findAllAgeCategories(),
    ]);

    return { data: rows.map((row) => toRecord(row, belts, categories)), meta: { page, pageSize, total } };
  }

  const filters: CompetitionFilters = {
    province: provinceOf(identity),
    status: "PUBLISHED",
    discipline: query.discipline,
    gender: identity.gender ?? undefined,
    search,
    coachCountyId: identity.countyId ?? "none",
  };

  const [total, rows, belts, categories] = await Promise.all([
    repo.countCompetitions(filters),
    repo.findCompetitions(filters, (page - 1) * pageSize, pageSize, "deadlineAsc"),
    repo.findAllBelts(),
    repo.findAllAgeCategories(),
  ]);

  const data = await Promise.all(
    rows.map(async (row) => {
      const decoration = await decorateForCoach(repo, user.id, row, belts);
      return { ...toRecord(row, belts, categories), ...decoration };
    }),
  );

  return { data, meta: { page, pageSize, total } };
}

export async function getCompetition(repo: CompetitionsRepository, user: CurrentUser, id: string): Promise<CompetitionView> {
  const identity = await requireActiveUser(repo, user);
  const row = await repo.findCompetitionById(id);
  if (!row) throw competitionNotFound();

  const [belts, categories] = await Promise.all([repo.findAllBelts(), repo.findAllAgeCategories()]);
  if (identity.role === "SUPER_ADMIN") return toRecord(row, belts, categories);

  if (identity.role === "ADMIN") {
    if (row.province !== provinceOf(identity)) throw competitionNotFound();
    return toRecord(row, belts, categories);
  }

  if (row.province !== provinceOf(identity) || row.status === "DRAFT") throw competitionNotFound();
  if (row.level === "COUNTY" && !row.countyIds.includes(identity.countyId ?? "")) throw competitionNotFound();
  const decoration = await decorateForCoach(repo, user.id, row, belts);

  return { ...toRecord(row, belts, categories), ...decoration };
}

export async function createCompetition(
  repo: CompetitionsRepository,
  user: CurrentUser,
  input: CreateCompetitionInput,
): Promise<CompetitionRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const registrationDeadline = new Date(input.registrationDeadline);
  const eventDate = new Date(input.eventDate);
  const range = await validateCompetitionData(repo, {
    discipline: input.discipline,
    gender: input.gender,
    ageCategoryId: input.ageCategoryId,
    beltIds: input.beltIds,
    registrationDeadline,
    eventDate,
  });

  const countyIds = input.level === "COUNTY" ? await validateCounties(repo, provinceOf(identity), input.countyIds ?? []) : [];

  const data: NewCompetitionData = {
    title: input.title,
    province: provinceOf(identity),
    level: input.level,
    countyIds,
    discipline: input.discipline,
    gender: input.gender,
    ageCategoryId: input.ageCategoryId,
    minBeltId: range.minBeltId,
    maxBeltId: range.maxBeltId,
    feePerStudent: BigInt(input.feePerStudent),
    payeeCardNumber: input.payeeCardNumber,
    payeeCardHolder: input.payeeCardHolder,
    registrationDeadline,
    eventDate,
    status: "DRAFT",
  };

  const row = await repo.createCompetition(data);

  return toRecord(row, range.belts, range.categories);
}

export async function updateCompetition(
  repo: CompetitionsRepository,
  user: CurrentUser,
  id: string,
  input: UpdateCompetitionInput,
): Promise<CompetitionRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await repo.findCompetitionById(id);
  if (!row || row.province !== identity.province) throw competitionNotFound();

  const registrations = await repo.countRegistrations(id);
  if (registrations > 0) {
    throw new AppError(409, "CONFLICT", "این مسابقه ثبت نام دارد و قابل ویرایش نیست.");
  }

  const beltsForMerge = await repo.findAllBelts();
  const range = await validateCompetitionData(repo, {
    discipline: input.discipline ?? row.discipline,
    gender: input.gender ?? row.gender,
    ageCategoryId: input.ageCategoryId ?? row.ageCategoryId,
    beltIds: input.beltIds ?? expandBeltIds(row, beltsForMerge),
    registrationDeadline: input.registrationDeadline !== undefined ? new Date(input.registrationDeadline) : row.registrationDeadline,
    eventDate: input.eventDate !== undefined ? new Date(input.eventDate) : row.eventDate,
  });

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.discipline !== undefined) data.discipline = input.discipline;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.ageCategoryId !== undefined) data.ageCategoryId = input.ageCategoryId;
  if (input.beltIds !== undefined) {
    data.minBeltId = range.minBeltId;
    data.maxBeltId = range.maxBeltId;
  }
  if (input.feePerStudent !== undefined) data.feePerStudent = BigInt(input.feePerStudent);
  if (input.payeeCardNumber !== undefined) data.payeeCardNumber = input.payeeCardNumber;
  if (input.payeeCardHolder !== undefined) data.payeeCardHolder = input.payeeCardHolder;
  if (input.registrationDeadline !== undefined) data.registrationDeadline = new Date(input.registrationDeadline);
  if (input.eventDate !== undefined) data.eventDate = new Date(input.eventDate);

  if (input.level !== undefined || input.countyIds !== undefined) {
    const mergedLevel = input.level ?? row.level;
    const mergedCountyIds = input.countyIds ?? row.countyIds;

    if (mergedLevel === "COUNTY") {
      data.countyIds = await validateCounties(repo, provinceOf(identity), mergedCountyIds);
      if (input.level !== undefined) data.level = input.level;
    } else {
      if (input.level !== undefined) data.level = "PROVINCIAL";
      data.countyIds = [];
    }
  }

  const updated = await repo.updateCompetition(id, data);

  return toRecord(updated, range.belts, range.categories);
}

export async function publishCompetition(repo: CompetitionsRepository, user: CurrentUser, id: string): Promise<CompetitionRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await repo.findCompetitionById(id);
  if (!row || row.province !== identity.province) throw competitionNotFound();

  if (row.status === "CANCELED") {
    throw new AppError(409, "CONFLICT", "مسابقه لغو شده قابل انتشار مجدد نیست.");
  }
  if (row.status === "PUBLISHED") {
    throw new AppError(409, "CONFLICT", "این مسابقه قبلاً منتشر شده است.");
  }

  const beltsForMerge = await repo.findAllBelts();
  await validateCompetitionData(repo, {
    discipline: row.discipline,
    gender: row.gender,
    ageCategoryId: row.ageCategoryId,
    beltIds: expandBeltIds(row, beltsForMerge),
    registrationDeadline: row.registrationDeadline,
    eventDate: row.eventDate,
  });

  if (row.registrationDeadline.getTime() <= Date.now()) {
    throw new AppError(400, "VALIDATION_ERROR", "مهلت ثبت نام گذشته است و مسابقه قابل انتشار نیست.");
  }

  const updated = await repo.publishWithRulesSnapshot(id);
  if (!updated) throw new AppError(409, "CONFLICT", "این مسابقه قبلاً منتشر شده است.");

  return toRecord(updated, beltsForMerge, await repo.findAllAgeCategories());
}

export async function cancelCompetition(
  repo: CompetitionsRepository,
  user: CurrentUser,
  id: string,
  reason: string,
): Promise<CompetitionRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await repo.findCompetitionById(id);
  if (!row || row.province !== identity.province) throw competitionNotFound();

  if (row.status === "CANCELED") {
    throw new AppError(409, "CONFLICT", "این مسابقه قبلاً لغو شده است.");
  }
  if (row.status !== "PUBLISHED") {
    throw new AppError(409, "CONFLICT", "فقط مسابقه منتشر شده قابل لغو است.");
  }

  const [belts, categories] = await Promise.all([repo.findAllBelts(), repo.findAllAgeCategories()]);
  const updated = await repo.cancelCompetitionWithRefunds(id, reason);
  if (updated) return toRecord(updated, belts, categories);

  const current = await repo.findCompetitionById(id);
  if (current?.status === "CANCELED") {
    throw new AppError(409, "CONFLICT", "این مسابقه قبلاً لغو شده است.");
  }

  throw new AppError(409, "CONFLICT", "فقط مسابقه منتشر شده قابل لغو است.");
}

export async function extendCompetition(
  repo: CompetitionsRepository,
  user: CurrentUser,
  id: string,
  input: ExtendCompetitionInput,
): Promise<CompetitionRecord> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await repo.findCompetitionById(id);
  if (!row || row.province !== identity.province) throw competitionNotFound();

  if (row.status === "CANCELED") {
    throw new AppError(409, "CONFLICT", "مسابقه لغو شده قابل تمدید نیست.");
  }

  const newDeadline = new Date(input.newDeadline);
  if (newDeadline.getTime() <= row.registrationDeadline.getTime()) {
    throw new AppError(400, "VALIDATION_ERROR", "مهلت جدید باید بعد از مهلت فعلی باشد.");
  }
  if (newDeadline.getTime() >= row.eventDate.getTime()) {
    throw new AppError(400, "VALIDATION_ERROR", "مهلت جدید باید قبل از تاریخ برگزاری باشد.");
  }

  const updated = await repo.extendDeadline({
    competitionId: id,
    previousDeadline: row.registrationDeadline,
    newDeadline,
    reopenForRejected: input.reopenForRejected ?? false,
    reason: input.reason,
    createdById: user.id,
  });

  return toRecord(updated, await repo.findAllBelts(), await repo.findAllAgeCategories());
}

export async function listDeadlineExtensions(repo: CompetitionsRepository, user: CurrentUser, id: string): Promise<DeadlineExtensionRow[]> {
  const identity = await requireActiveUser(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await repo.findCompetitionById(id);
  if (!row || row.province !== identity.province) throw competitionNotFound();

  return repo.findDeadlineExtensions(id);
}
