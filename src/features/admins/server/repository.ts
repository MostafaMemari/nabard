import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
};

export type AdminFilters = {
  search?: string;
  isActive?: boolean;
};

export type AdminRecord = {
  id: string;
  mobile: string;
  fullName: string;
  role: "ADMIN";
  province: Province;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NewAdminData = {
  mobile: string;
  fullName: string;
  passwordHash: string;
  province: Province;
};

export type AdminUpdateData = {
  fullName?: string;
  mobile?: string;
  province?: Province;
  isActive?: boolean;
};

export type AdminsRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countAdmins(filters: AdminFilters): Promise<number>;
  findAdmins(filters: AdminFilters, skip: number, take: number): Promise<AdminRecord[]>;
  findAdminById(id: string): Promise<AdminRecord | null>;
  findMobileOwner(mobile: string): Promise<{ id: string } | null>;
  createAdmin(data: NewAdminData): Promise<AdminRecord>;
  updateAdmin(id: string, data: AdminUpdateData): Promise<AdminRecord>;
  updateAdminPassword(id: string, passwordHash: string): Promise<AdminRecord>;
};

const adminSelection = {
  id: true,
  mobile: true,
  fullName: true,
  role: true,
  province: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function adminWhere(filters: AdminFilters) {
  return {
    role: "ADMIN" as const,
    ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
    ...(filters.search === undefined
      ? {}
      : {
          OR: [{ fullName: { contains: filters.search, mode: "insensitive" as const } }, { mobile: { contains: filters.search } }],
        }),
  };
}

function toAdminRecord(row: {
  id: string;
  mobile: string;
  fullName: string;
  role: string;
  province: Province | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminRecord {
  if (row.province === null) throw new Error("Admin user without province");

  return {
    id: row.id,
    mobile: row.mobile,
    fullName: row.fullName,
    role: "ADMIN",
    province: row.province,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function countAdmins(filters: AdminFilters): Promise<number> {
  return getPrisma().user.count({ where: adminWhere(filters) });
}

export async function findAdmins(filters: AdminFilters, skip: number, take: number): Promise<AdminRecord[]> {
  const rows = await getPrisma().user.findMany({
    where: adminWhere(filters),
    select: adminSelection,
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });

  return rows.map(toAdminRecord);
}

export async function findAdminById(id: string): Promise<AdminRecord | null> {
  const row = await getPrisma().user.findUnique({ where: { id }, select: adminSelection });
  return row && row.role === "ADMIN" ? toAdminRecord(row) : null;
}

export async function findMobileOwner(mobile: string): Promise<{ id: string } | null> {
  return getPrisma().user.findUnique({ where: { mobile }, select: { id: true } });
}

export async function createAdmin(data: NewAdminData): Promise<AdminRecord> {
  const row = await getPrisma().user.create({
    data: {
      mobile: data.mobile,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      nationalCode: null,
      role: "ADMIN",
      province: data.province,
      isActive: true,
    },
    select: adminSelection,
  });

  return toAdminRecord(row);
}

export async function updateAdmin(id: string, data: AdminUpdateData): Promise<AdminRecord> {
  const row = await getPrisma().user.update({ where: { id }, data, select: adminSelection });

  return toAdminRecord(row);
}

export async function updateAdminPassword(id: string, passwordHash: string): Promise<AdminRecord> {
  const row = await getPrisma().user.update({ where: { id }, data: { passwordHash }, select: adminSelection });

  return toAdminRecord(row);
}
