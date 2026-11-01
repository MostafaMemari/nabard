import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { AgeCategoryDatesInput } from "../schemas";
import type { UserIdentityRecord } from "./admin-repository";
import type { AgeCategoryRecord } from "./repository";

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function ageCategoryNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "رده سنی یافت نشد.");
}

export type AgeCategoriesAdminRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findAgeCategoryById(id: string): Promise<AgeCategoryRecord | null>;
  countPublishedCompetitionRegistrations(ageCategoryId: string): Promise<number>;
  updateAgeCategoryDates(id: string, data: { startDate: Date; endDate: Date }): Promise<AgeCategoryRecord>;
};

async function requireActiveSuperAdmin(repo: AgeCategoriesAdminRepository, user: CurrentUser): Promise<void> {
  if (user.role !== "SUPER_ADMIN") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();
}

export async function getAgeCategory(repo: AgeCategoriesAdminRepository, user: CurrentUser, id: string): Promise<AgeCategoryRecord> {
  await requireActiveSuperAdmin(repo, user);

  const category = await repo.findAgeCategoryById(id);
  if (!category) throw ageCategoryNotFound();

  return category;
}

export async function updateAgeCategoryDates(
  repo: AgeCategoriesAdminRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: AgeCategoryDatesInput,
): Promise<AgeCategoryRecord> {
  await requireActiveSuperAdmin(repo, user);

  const category = await repo.findAgeCategoryById(id);
  if (!category) throw ageCategoryNotFound();

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  if (endDate.getTime() <= startDate.getTime()) {
    throw new AppError(400, "VALIDATION_ERROR", "تاریخ پایان باید بعد از تاریخ شروع باشد.");
  }

  const registrations = await repo.countPublishedCompetitionRegistrations(id);
  if (registrations > 0) {
    throw new AppError(409, "CONFLICT", "برای این رده سنی در مسابقه منتشر شده ثبت نام انجام شده و تاریخ های آن قابل تغییر نیست.");
  }

  const updated = await repo.updateAgeCategoryDates(id, { startDate, endDate });

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.ageCategoryDatesChanged,
    entityType: auditEntityTypes.ageCategory,
    entityId: updated.id,
    details: {
      name: updated.name,
      previous: { startDate: category.startDate.toISOString(), endDate: category.endDate.toISOString() },
      next: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    },
  });

  return updated;
}
