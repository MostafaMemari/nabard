import { hash } from "bcryptjs";
import { genderLabels } from "@/features/base-data/labels";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import { toPersianDigits } from "@/lib/format";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import { deleteStorageFileQuietly } from "@/lib/storage";
import { readProfileImage } from "@/lib/storage/image";
import type { Storage } from "@/lib/storage/types";
import type { CoachInput, CoachListQuery, CoachLookupQuery, UpdateCoachInput } from "../schemas";
import type {
  CoachFilters,
  CoachRecord,
  CoachRepository,
  CoachTargetRow,
  CoachUpdateData,
  CountyRecord,
  NewCoachData,
  UserIdentityRecord,
} from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

function coachNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مربی یافت نشد");
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
}

async function requireActiveUser(repo: CoachRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  if (user.role === "COACH") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

async function requireActiveAdmin(repo: CoachRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  if (user.role !== "ADMIN") throw forbidden();

  const admin = await repo.findUserById(user.id);
  if (!admin) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!admin.isActive || admin.role !== "ADMIN") throw forbidden();

  return admin;
}

async function coachInView(repo: CoachRepository, identity: UserIdentityRecord, id: string): Promise<CoachRecord> {
  const coach = await repo.findCoachById(id);
  if (!coach || coach.role !== "COACH") throw coachNotFound();
  if (identity.role === "ADMIN" && coach.province !== provinceOf(identity)) throw coachNotFound();

  return coach;
}

async function countyInProvince(repo: CoachRepository, province: UserIdentityRecord["province"], countyId: string): Promise<CountyRecord> {
  const county = await repo.findCountyById(countyId);
  if (!county || county.province !== province) {
    throw new AppError(400, "VALIDATION_ERROR", "شهرستان انتخاب شده معتبر نیست");
  }

  return county;
}

function toFilters(query: CoachListQuery): CoachFilters {
  return {
    search: query.search?.trim() || undefined,
    isActive: query.status === undefined ? undefined : query.status === "active",
  };
}

export async function listCoaches(repo: CoachRepository, user: CurrentUser, query: CoachListQuery): Promise<ListResult<CoachRecord>> {
  const identity = await requireActiveUser(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(query);
  const province = identity.role === "SUPER_ADMIN" ? query.province : provinceOf(identity);

  const [total, coaches] = await Promise.all([
    repo.countCoaches(province, filters),
    repo.findCoaches(province, filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: coaches, meta: { page, pageSize, total } };
}

// Minimal target-coach directory used by coach change and province change
// request forms. Admins and coaches may look up any province (the province
// change form needs the destination province); the super admin must pass one.
export async function listCoachTargets(repo: CoachRepository, user: CurrentUser, query: CoachLookupQuery): Promise<CoachTargetRow[]> {
  const identity = await requireActiveUser(repo, user);

  let province: Province;
  if (query.province !== undefined) {
    province = query.province;
  } else if (identity.role === "SUPER_ADMIN") {
    throw new AppError(400, "VALIDATION_ERROR", "استان را انتخاب کنید");
  } else {
    province = provinceOf(identity);
  }

  return repo.findActiveCoachTargets(province);
}

export async function getCoach(repo: CoachRepository, user: CurrentUser, id: string): Promise<CoachRecord> {
  const identity = await requireActiveUser(repo, user);
  return coachInView(repo, identity, id);
}

export async function createCoach(repo: CoachRepository, user: CurrentUser, input: CoachInput): Promise<CoachRecord> {
  const admin = await requireActiveAdmin(repo, user);
  const province = provinceOf(admin);

  const mobileOwner = await repo.findMobileOwner(input.mobile);
  if (mobileOwner) throw new AppError(409, "CONFLICT", "این شماره همراه قبلاً ثبت شده است");

  const codeOwner = await repo.findNationalCodeOwner(input.nationalCode);
  if (codeOwner) throw new AppError(409, "CONFLICT", "این کد ملی قبلاً ثبت شده است");

  await countyInProvince(repo, province, input.countyId);

  const passwordHash = await hash(input.initialPassword, 10);
  const data: NewCoachData = {
    mobile: input.mobile,
    fullName: input.fullName,
    nationalCode: input.nationalCode,
    passwordHash,
    province,
    countyId: input.countyId,
    gender: input.gender,
  };

  return repo.createCoach(data);
}

export async function updateCoach(repo: CoachRepository, user: CurrentUser, id: string, input: UpdateCoachInput): Promise<CoachRecord> {
  const admin = await requireActiveAdmin(repo, user);
  const province = provinceOf(admin);
  const coach = await coachInView(repo, admin, id);

  if (input.mobile !== undefined) {
    const owner = await repo.findMobileOwner(input.mobile);
    if (owner && owner.id !== id) throw new AppError(409, "CONFLICT", "این شماره همراه قبلاً ثبت شده است");
  }

  if (input.nationalCode !== undefined) {
    const owner = await repo.findNationalCodeOwner(input.nationalCode);
    if (owner && owner.id !== id) throw new AppError(409, "CONFLICT", "این کد ملی قبلاً ثبت شده است");
  }

  const data: CoachUpdateData = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.mobile !== undefined) data.mobile = input.mobile;
  if (input.nationalCode !== undefined) data.nationalCode = input.nationalCode;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.countyId !== undefined) {
    await countyInProvince(repo, province, input.countyId);
    data.countyId = input.countyId;
  }
  if (input.gender !== undefined && input.gender !== coach.gender) {
    const otherGender = input.gender === "MALE" ? "FEMALE" : "MALE";
    const otherCount = await repo.countStudentsByGender(id, otherGender);
    if (otherCount > 0) {
      throw new AppError(
        409,
        "CONFLICT",
        `تغییر جنسیت مربی ممکن نیست؛ این مربی ${toPersianDigits(otherCount)} هنرجوی ${genderLabels[otherGender]} دارد. ابتدا آن ها را به مربی هم جنسیت منتقل کنید`,
      );
    }
    data.gender = input.gender;
  }

  return repo.updateCoach(id, data);
}

export async function resetCoachPassword(repo: CoachRepository, user: CurrentUser, id: string, password: string): Promise<CoachRecord> {
  const admin = await requireActiveAdmin(repo, user);
  const coach = await coachInView(repo, admin, id);
  const passwordHash = await hash(password, 10);

  return repo.updateCoachPassword(coach.id, passwordHash);
}

async function requireActiveCoach(repo: CoachRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== "COACH" || user.role !== "COACH") throw forbidden();

  return record;
}

function photoNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "عکسی بارگذاری نشده است");
}

export async function uploadCoachPhoto(repo: CoachRepository, storage: Storage, user: CurrentUser, file: File): Promise<null> {
  await requireActiveCoach(repo, user);

  const image = await readProfileImage(file);
  const stored = await storage.put({ ...image, folder: "coach-photos" });

  try {
    const previous = await repo.setPhotoFileId(user.id, stored.id);
    if (previous !== null && previous !== stored.id) {
      await deleteStorageFileQuietly(storage, previous);
    }

    return null;
  } catch (error) {
    await deleteStorageFileQuietly(storage, stored.id);
    throw error;
  }
}

export async function deleteCoachPhoto(repo: CoachRepository, storage: Storage, user: CurrentUser): Promise<null> {
  await requireActiveCoach(repo, user);

  const previous = await repo.findPhotoFileId(user.id);
  if (previous === null) throw photoNotFound();

  await repo.setPhotoFileId(user.id, null);
  await deleteStorageFileQuietly(storage, previous);

  return null;
}

export async function readCoachPhoto(
  repo: CoachRepository,
  storage: Storage,
  user: CurrentUser,
  coachId: string,
): Promise<{ stream: ReadableStream<Uint8Array>; mime: string; size: number }> {
  const identity = await repo.findUserById(user.id);
  if (!identity || !identity.isActive) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");

  const coach = await repo.findUserById(coachId);
  const inScope =
    coach !== null &&
    coach.role === "COACH" &&
    (identity.role === "SUPER_ADMIN" ||
      (identity.role === "ADMIN"
        ? coach.province !== null && coach.province === identity.province
        : user.role === "COACH" && user.id === coachId));
  if (!inScope) throw coachNotFound();

  const fileId = await repo.findPhotoFileId(coachId);
  if (fileId === null) throw photoNotFound();

  const file = await storage.get(fileId);
  if (!file) throw photoNotFound();

  return { stream: file.stream, mime: file.mime, size: file.size };
}
