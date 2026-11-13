import { hash } from "bcryptjs";
import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import { AppError } from "@/lib/api";
import type { ListResult } from "@/lib/pagination";
import type { CurrentUser } from "@/lib/session";
import type { AdminListQuery, CreateAdminInput, ResetAdminPasswordInput, UpdateAdminInput } from "../schemas";
import type { AdminRecord, AdminsRepository, AdminUpdateData, NewAdminData } from "./repository";

const DEFAULT_PAGE_SIZE = 100;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

function adminNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "مدیر استان یافت نشد");
}

async function requireActiveSuperAdmin(repo: AdminsRepository, user: CurrentUser): Promise<void> {
  if (user.role !== "SUPER_ADMIN") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role) throw forbidden();
}

export async function listAdmins(repo: AdminsRepository, user: CurrentUser, query: AdminListQuery): Promise<ListResult<AdminRecord>> {
  await requireActiveSuperAdmin(repo, user);

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const filters = {
    search: query.search?.trim() || undefined,
    isActive: query.status === undefined ? undefined : query.status === "active",
  };

  const [total, admins] = await Promise.all([repo.countAdmins(filters), repo.findAdmins(filters, (page - 1) * pageSize, pageSize)]);

  return { data: admins, meta: { page, pageSize, total } };
}

export async function getAdmin(repo: AdminsRepository, user: CurrentUser, id: string): Promise<AdminRecord> {
  await requireActiveSuperAdmin(repo, user);

  const admin = await repo.findAdminById(id);
  if (!admin) throw adminNotFound();

  return admin;
}

export async function createAdmin(
  repo: AdminsRepository,
  audit: AuditRepository,
  user: CurrentUser,
  input: CreateAdminInput,
): Promise<AdminRecord> {
  await requireActiveSuperAdmin(repo, user);

  const mobileOwner = await repo.findMobileOwner(input.mobile);
  if (mobileOwner) throw new AppError(409, "CONFLICT", "این شماره همراه قبلاً ثبت شده است");

  const passwordHash = await hash(input.initialPassword, 10);
  const data: NewAdminData = {
    mobile: input.mobile,
    fullName: input.fullName,
    passwordHash,
    province: input.province,
  };

  const admin = await repo.createAdmin(data);
  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.adminCreated,
    entityType: auditEntityTypes.admin,
    entityId: admin.id,
    details: { province: admin.province },
  });

  return admin;
}

export async function updateAdmin(
  repo: AdminsRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: UpdateAdminInput,
): Promise<AdminRecord> {
  await requireActiveSuperAdmin(repo, user);

  const current = await repo.findAdminById(id);
  if (!current) throw adminNotFound();

  if (input.mobile !== undefined) {
    const owner = await repo.findMobileOwner(input.mobile);
    if (owner && owner.id !== id) throw new AppError(409, "CONFLICT", "این شماره همراه قبلاً ثبت شده است");
  }

  const data: AdminUpdateData = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.mobile !== undefined) data.mobile = input.mobile;
  if (input.province !== undefined) data.province = input.province;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const admin = await repo.updateAdmin(id, data);

  if (input.isActive !== undefined && input.isActive !== current.isActive) {
    await audit.createAuditLog({
      actorId: user.id,
      action: input.isActive ? auditActions.adminActivated : auditActions.adminDeactivated,
      entityType: auditEntityTypes.admin,
      entityId: admin.id,
      details: { province: admin.province },
    });
  }

  return admin;
}

export async function resetAdminPassword(
  repo: AdminsRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  input: ResetAdminPasswordInput,
): Promise<AdminRecord> {
  await requireActiveSuperAdmin(repo, user);

  const admin = await repo.findAdminById(id);
  if (!admin) throw adminNotFound();

  const passwordHash = await hash(input.password, 10);
  const updated = await repo.updateAdminPassword(admin.id, passwordHash);

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.adminPasswordReset,
    entityType: auditEntityTypes.admin,
    entityId: admin.id,
    details: { province: admin.province },
  });

  return updated;
}
