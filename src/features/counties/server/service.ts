import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { CountyListQuery, CreateCountyInput, UpdateCountyInput } from "../schemas";
import type { County } from "../types";
import type { CountiesRepository, UserIdentityRecord } from "./repository";

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function countyNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "شهرستان یافت نشد.");
}

async function requireActiveUser(repo: CountiesRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

async function requireActiveSuperAdmin(repo: CountiesRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  if (user.role !== "SUPER_ADMIN") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

export async function listCounties(repo: CountiesRepository, user: CurrentUser, query: CountyListQuery = {}): Promise<County[]> {
  const record = await requireActiveUser(repo, user);

  if (record.role === "SUPER_ADMIN") {
    return repo.findAllCounties(query.province);
  }

  if (record.province === null) throw forbidden();

  return repo.findCountiesByProvince(record.province);
}

export async function createCounty(
  repo: CountiesRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: CreateCountyInput,
): Promise<County> {
  await requireActiveSuperAdmin(repo, user);

  const existing = await repo.findAllCounties(input.province);
  if (existing.some((county) => county.name === input.name)) {
    throw new AppError(409, "CONFLICT", "این شهرستان در این استان قبلا ثبت شده است.");
  }

  const county = await repo.createCounty(input);
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.countyCreated,
    entityType: auditEntityTypes.county,
    entityId: county.id,
    details: { province: county.province, name: county.name },
  });

  return county;
}

export async function updateCounty(
  repo: CountiesRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: UpdateCountyInput,
): Promise<County> {
  await requireActiveSuperAdmin(repo, user);

  const county = await repo.findCountyById(id);
  if (!county) throw countyNotFound();

  const existing = await repo.findAllCounties(county.province);
  if (existing.some((item) => item.id !== id && item.name === input.name)) {
    throw new AppError(409, "CONFLICT", "این شهرستان در این استان قبلا ثبت شده است.");
  }

  const updated = await repo.updateCounty(id, input);
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.countyUpdated,
    entityType: auditEntityTypes.county,
    entityId: updated.id,
    details: { province: updated.province, name: updated.name },
  });

  return updated;
}

export async function deleteCounty(
  repo: CountiesRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
): Promise<{ id: string }> {
  await requireActiveSuperAdmin(repo, user);

  const county = await repo.findCountyById(id);
  if (!county) throw countyNotFound();

  const [coaches, competitions, changeRequests] = await Promise.all([
    repo.countCountyCoaches(id),
    repo.countCountyCompetitions(id),
    repo.countCountyChangeRequests(id),
  ]);

  if (coaches > 0 || competitions > 0 || changeRequests > 0) {
    throw new AppError(409, "CONFLICT", "این شهرستان به مربی یا مسابقه ای متصل است و قابل حذف نیست.");
  }

  await repo.deleteCounty(id);
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.countyDeleted,
    entityType: auditEntityTypes.county,
    entityId: county.id,
    details: { province: county.province, name: county.name },
  });

  return { id };
}
