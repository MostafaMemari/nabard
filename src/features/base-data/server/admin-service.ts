import { randomUUID } from "node:crypto";
import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import { AppError } from "@/lib/api";
import { jalaliYear } from "@/lib/format";
import type { CurrentUser } from "@/lib/session";
import type { AgeCategoryCreateInput, AgeCategoryUpdateInput, BeltCreateInput, BeltUpdateInput, WeightClassSetInput } from "../schemas";
import type { Gender } from "../types";
import { sortWeightClassSetRows, validateWeightClassSet } from "../weight-set-validation";
import type * as repository from "./admin-repository";
import type { AgeCategoryRecord } from "./repository";

export type BaseDataAdminRepository = typeof repository;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

async function requireActiveSuperAdmin(repo: BaseDataAdminRepository, user: CurrentUser): Promise<void> {
  if (user.role !== "SUPER_ADMIN") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role) throw forbidden();
}

function generatedCode(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function conflict(message: string): AppError {
  return new AppError(409, "CONFLICT", message);
}

// ───────────── Belts ─────────────

export async function listBelts(
  repo: BaseDataAdminRepository,
  user: CurrentUser,
  includeArchived: boolean,
): Promise<repository.BeltRecord[]> {
  if (includeArchived) await requireActiveSuperAdmin(repo, user);
  return repo.listBelts(includeArchived);
}

export async function createBelt(
  repo: BaseDataAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: BeltCreateInput,
): Promise<repository.BeltRecord> {
  await requireActiveSuperAdmin(repo, user);

  if (await repo.findBeltByLabel(input.label)) {
    throw conflict("کمربند دیگری با این نام وجود دارد");
  }
  if (await repo.findBeltByLevel(input.level)) {
    throw conflict("کمربند دیگری با این سطح وجود دارد");
  }

  const code = input.code ?? generatedCode("belt");
  if (await repo.findBeltByCode(code)) {
    throw conflict("کمربند دیگری با این کد وجود دارد");
  }

  const belt = await repo.createBelt({
    code,
    label: input.label,
    level: input.level,
    order: input.level,
    rankType: input.rankType,
    color: input.color ?? null,
    colorHex: input.colorHex ?? null,
  });

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.beltCreated,
    entityType: auditEntityTypes.belt,
    entityId: belt.id,
    details: { label: belt.label, level: belt.level },
  });

  return belt;
}

export async function updateBelt(
  repo: BaseDataAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: BeltUpdateInput,
): Promise<repository.BeltRecord> {
  await requireActiveSuperAdmin(repo, user);

  const belt = await repo.findBeltById(id);
  if (!belt) throw new AppError(404, "NOT_FOUND", "کمربند یافت نشد");

  if (input.label !== undefined && input.label !== belt.label && (await repo.findBeltByLabel(input.label, id))) {
    throw conflict("کمربند دیگری با این نام وجود دارد");
  }
  if (input.level !== undefined && input.level !== belt.level && (await repo.findBeltByLevel(input.level, id))) {
    throw conflict("کمربند دیگری با این سطح وجود دارد");
  }

  const updated = await repo.updateBelt(id, {
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.level === undefined ? {} : { level: input.level }),
    ...(input.rankType === undefined ? {} : { rankType: input.rankType }),
    ...(input.color === undefined ? {} : { color: input.color }),
    ...(input.colorHex === undefined ? {} : { colorHex: input.colorHex }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  });

  await audit.createAuditLog({
    actorId: user.id,
    action:
      input.isActive === undefined ? auditActions.beltUpdated : input.isActive ? auditActions.beltRestored : auditActions.beltArchived,
    entityType: auditEntityTypes.belt,
    entityId: belt.id,
    details: { label: updated.label, isActive: updated.isActive },
  });

  return updated;
}

export async function deleteBelt(repo: BaseDataAdminRepository, audit: AuditRepository, user: CurrentUser, id: string): Promise<void> {
  await requireActiveSuperAdmin(repo, user);

  const belt = await repo.findBeltById(id);
  if (!belt) throw new AppError(404, "NOT_FOUND", "کمربند یافت نشد");

  const [students, competitions] = await Promise.all([repo.countStudentsByBelt(id), repo.countCompetitionsByBelt(id)]);
  if (students > 0 || competitions > 0) {
    throw conflict("این کمربند در پروفایل هنرجوها یا مسابقه ها استفاده شده است و قابل حذف نیست؛ می توانید آن را بایگانی کنید");
  }

  await repo.deleteBelt(id);

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.beltDeleted,
    entityType: auditEntityTypes.belt,
    entityId: belt.id,
    details: { label: belt.label, level: belt.level },
  });
}

// ───────────── Age categories ─────────────

export async function listAgeCategories(
  repo: BaseDataAdminRepository,
  user: CurrentUser,
  includeArchived: boolean,
): Promise<AgeCategoryRecord[]> {
  if (includeArchived) await requireActiveSuperAdmin(repo, user);
  return repo.listAgeCategories(includeArchived);
}

function toRange(start: string, end: string): { start: Date; end: Date } {
  return { start: new Date(start), end: new Date(end) };
}

function birthYearsOf(range: { start: Date; end: Date }): { birthYearStart: number; birthYearEnd: number } {
  return { birthYearStart: jalaliYear(range.start), birthYearEnd: jalaliYear(range.end) };
}

async function assertNoOverlap(repo: BaseDataAdminRepository, range: { start: Date; end: Date }, excludeId?: string): Promise<void> {
  const overlapping = await repo.findOverlappingActiveCategory(range, excludeId);
  if (overlapping) {
    throw new AppError(409, "CONFLICT", `بازه تاریخ با رده سنی فعال «${overlapping.label}» همپوشانی دارد`, { field: "endDate" });
  }
}

export async function createAgeCategory(
  repo: BaseDataAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: AgeCategoryCreateInput,
): Promise<AgeCategoryRecord> {
  await requireActiveSuperAdmin(repo, user);

  if (await repo.findAgeCategoryByLabel(input.label)) {
    throw conflict("رده سنی دیگری با این نام وجود دارد");
  }

  const range = toRange(input.startDate, input.endDate);
  await assertNoOverlap(repo, range);

  const code = input.code ?? generatedCode("age_category");
  if (await repo.findAgeCategoryByCode(code)) {
    throw conflict("رده سنی دیگری با این کد وجود دارد");
  }

  const category = await repo.createAgeCategory({
    code,
    label: input.label,
    startDate: range.start,
    endDate: range.end,
    ...birthYearsOf(range),
  });

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.ageCategoryCreated,
    entityType: auditEntityTypes.ageCategory,
    entityId: category.id,
    details: { label: category.label },
  });

  return category;
}

export async function updateAgeCategory(
  repo: BaseDataAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: AgeCategoryUpdateInput,
): Promise<AgeCategoryRecord> {
  await requireActiveSuperAdmin(repo, user);

  const category = await repo.findAgeCategoryById(id);
  if (!category) throw new AppError(404, "NOT_FOUND", "رده سنی یافت نشد");

  if (input.label !== undefined && input.label !== category.label && (await repo.findAgeCategoryByLabel(input.label, id))) {
    throw conflict("رده سنی دیگری با این نام وجود دارد");
  }

  const range = toRange(input.startDate ?? category.startDate.toISOString(), input.endDate ?? category.endDate.toISOString());
  if (input.startDate !== undefined || input.endDate !== undefined) {
    await assertNoOverlap(repo, range, id);
  }

  const updated = await repo.updateAgeCategory(id, {
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.startDate === undefined ? {} : { startDate: range.start }),
    ...(input.endDate === undefined ? {} : { endDate: range.end }),
    ...(input.startDate === undefined && input.endDate === undefined ? {} : birthYearsOf(range)),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
  });

  await audit.createAuditLog({
    actorId: user.id,
    action:
      input.isActive === undefined
        ? auditActions.ageCategoryUpdated
        : input.isActive
          ? auditActions.ageCategoryRestored
          : auditActions.ageCategoryArchived,
    entityType: auditEntityTypes.ageCategory,
    entityId: category.id,
    details: {
      label: updated.label,
      isActive: updated.isActive,
      ...(input.startDate === undefined && input.endDate === undefined
        ? {}
        : {
            previous: { startDate: category.startDate.toISOString(), endDate: category.endDate.toISOString() },
            next: { startDate: range.start.toISOString(), endDate: range.end.toISOString() },
          }),
    },
  });

  return updated;
}

export async function deleteAgeCategory(
  repo: BaseDataAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
): Promise<void> {
  await requireActiveSuperAdmin(repo, user);

  const category = await repo.findAgeCategoryById(id);
  if (!category) throw new AppError(404, "NOT_FOUND", "رده سنی یافت نشد");

  const [competitions, registrations] = await Promise.all([
    repo.countCompetitionsByAgeCategory(id),
    repo.countRegistrationsByAgeCategory(id),
  ]);
  if (competitions > 0 || registrations > 0) {
    throw conflict("این رده سنی در مسابقه ها یا ثبت نام ها استفاده شده است و قابل حذف نیست؛ می توانید آن را بایگانی کنید");
  }

  await repo.deleteAgeCategory(id);

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.ageCategoryDeleted,
    entityType: auditEntityTypes.ageCategory,
    entityId: category.id,
    details: { label: category.label },
  });
}

// ───────────── Weight class sets ─────────────

export async function getWeightClassSet(
  repo: BaseDataAdminRepository,
  user: CurrentUser,
  params: { ageCategoryId: string; gender: Gender },
): Promise<repository.WeightClassSetRecord[]> {
  await requireActiveSuperAdmin(repo, user);
  return repo.findWeightClassSet(params.ageCategoryId, params.gender);
}

export type WeightClassSetSaveResult = {
  created: number;
  updated: number;
  archived: number;
  deleted: number;
};

export async function saveWeightClassSet(
  repo: BaseDataAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: WeightClassSetInput,
): Promise<WeightClassSetSaveResult> {
  await requireActiveSuperAdmin(repo, user);

  const category = await repo.findAgeCategoryById(input.ageCategoryId);
  if (!category) throw new AppError(404, "NOT_FOUND", "رده سنی یافت نشد");

  const issues = validateWeightClassSet(input.rows);
  if (issues.length > 0) {
    throw new AppError(400, "VALIDATION_ERROR", "رده های وزنی معتبر نیستند", issues);
  }

  const existing = await repo.findWeightClassSet(input.ageCategoryId, input.gender);
  const existingById = new Map(existing.map((row) => [row.id, row]));

  const rows = sortWeightClassSetRows(input.rows);
  const inputIds = rows.flatMap((row) => (row.id === undefined ? [] : [row.id]));
  if (new Set(inputIds).size !== inputIds.length) {
    throw new AppError(400, "VALIDATION_ERROR", "هر ردیف فقط یک بار می تواند ارسال شود");
  }
  for (const id of inputIds) {
    if (!existingById.has(id)) {
      throw new AppError(400, "VALIDATION_ERROR", "ردیف های ارسال شده با رده های وزنی فعلی همخوانی ندارند");
    }
  }

  const keepIds = new Set(inputIds);
  const removed = existing.filter((row) => !keepIds.has(row.id));
  const removedIds = removed.map((row) => row.id);
  const [registeredIds, snapshotIds] = await Promise.all([
    repo.findRegisteredWeightClassIds(removedIds),
    repo.findSnapshotWeightClassIds(input.ageCategoryId, input.gender),
  ]);
  const protectedIds = new Set([...registeredIds, ...snapshotIds]);

  const deleteIds = removed.filter((row) => !protectedIds.has(row.id)).map((row) => row.id);
  const archiveIds = removed.filter((row) => protectedIds.has(row.id)).map((row) => row.id);

  const plan: repository.WeightClassSetPlan = {
    ageCategoryId: input.ageCategoryId,
    gender: input.gender,
    updates: rows.flatMap((row, index) =>
      row.id === undefined
        ? []
        : [
            {
              id: row.id,
              label: row.label.trim(),
              minWeightKg: row.minWeightKg,
              maxWeightKg: row.maxWeightKg,
              excludeMin: row.excludeMin,
              excludeMax: row.excludeMax,
              order: index + 1,
            },
          ],
    ),
    creates: rows.flatMap((row, index) =>
      row.id === undefined
        ? [
            {
              label: row.label.trim(),
              minWeightKg: row.minWeightKg,
              maxWeightKg: row.maxWeightKg,
              excludeMin: row.excludeMin,
              excludeMax: row.excludeMax,
              order: index + 1,
            },
          ]
        : [],
    ),
    deleteIds,
    archiveIds,
  };

  await repo.saveWeightClassSet(plan);

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.weightClassSetUpdated,
    entityType: auditEntityTypes.weightClassSet,
    entityId: `${input.ageCategoryId}:${input.gender}`,
    details: {
      ageCategory: category.label,
      gender: input.gender,
      created: plan.creates.length,
      updated: plan.updates.length,
      archived: archiveIds.length,
      deleted: deleteIds.length,
    },
  });

  return {
    created: plan.creates.length,
    updated: plan.updates.length,
    archived: archiveIds.length,
    deleted: deleteIds.length,
  };
}
