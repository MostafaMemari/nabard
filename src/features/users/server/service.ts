import { hash } from "bcryptjs";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { CoachInput, CoachListQuery, UpdateCoachInput } from "../schemas";
import type { CoachFilters, CoachRecord, CoachRepository, CoachUpdateData, NewCoachData, UserIdentityRecord } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function coachNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مربی یافت نشد.");
}

async function requireActiveAdmin(repo: CoachRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  if (user.role !== "ADMIN") throw forbidden();

  const admin = await repo.findUserById(user.id);
  if (!admin) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!admin.isActive || admin.role !== "ADMIN") throw forbidden();

  return admin;
}

async function coachInScope(repo: CoachRepository, admin: UserIdentityRecord, id: string): Promise<CoachRecord> {
  const coach = await repo.findCoachById(id);
  if (!coach || coach.role !== "COACH" || coach.province !== admin.province) throw coachNotFound();

  return coach;
}

function toFilters(query: CoachListQuery): CoachFilters {
  return {
    search: query.search?.trim() || undefined,
    isActive: query.status === undefined ? undefined : query.status === "active",
  };
}

export async function listCoaches(repo: CoachRepository, user: CurrentUser, query: CoachListQuery): Promise<ListResult<CoachRecord>> {
  const admin = await requireActiveAdmin(repo, user);
  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = toFilters(query);

  const [total, coaches] = await Promise.all([
    repo.countCoaches(admin.province, filters),
    repo.findCoaches(admin.province, filters, (page - 1) * pageSize, pageSize),
  ]);

  return { data: coaches, meta: { page, pageSize, total } };
}

export async function getCoach(repo: CoachRepository, user: CurrentUser, id: string): Promise<CoachRecord> {
  const admin = await requireActiveAdmin(repo, user);
  return coachInScope(repo, admin, id);
}

export async function createCoach(repo: CoachRepository, user: CurrentUser, input: CoachInput): Promise<CoachRecord> {
  const admin = await requireActiveAdmin(repo, user);

  const mobileOwner = await repo.findMobileOwner(input.mobile);
  if (mobileOwner) throw new AppError(409, "CONFLICT", "این شماره همراه قبلاً ثبت شده است.");

  const codeOwner = await repo.findNationalCodeOwner(input.nationalCode);
  if (codeOwner) throw new AppError(409, "CONFLICT", "این کد ملی قبلاً ثبت شده است.");

  const passwordHash = await hash(input.initialPassword, 10);
  const data: NewCoachData = {
    mobile: input.mobile,
    fullName: input.fullName,
    nationalCode: input.nationalCode,
    passwordHash,
    province: admin.province,
  };

  return repo.createCoach(data);
}

export async function updateCoach(repo: CoachRepository, user: CurrentUser, id: string, input: UpdateCoachInput): Promise<CoachRecord> {
  const admin = await requireActiveAdmin(repo, user);
  await coachInScope(repo, admin, id);

  if (input.mobile !== undefined) {
    const owner = await repo.findMobileOwner(input.mobile);
    if (owner && owner.id !== id) throw new AppError(409, "CONFLICT", "این شماره همراه قبلاً ثبت شده است.");
  }

  if (input.nationalCode !== undefined) {
    const owner = await repo.findNationalCodeOwner(input.nationalCode);
    if (owner && owner.id !== id) throw new AppError(409, "CONFLICT", "این کد ملی قبلاً ثبت شده است.");
  }

  const data: CoachUpdateData = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.mobile !== undefined) data.mobile = input.mobile;
  if (input.nationalCode !== undefined) data.nationalCode = input.nationalCode;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return repo.updateCoach(id, data);
}
