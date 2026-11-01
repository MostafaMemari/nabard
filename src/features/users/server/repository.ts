import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type CoachRecord = {
  id: string;
  mobile: string;
  fullName: string;
  nationalCode: string | null;
  role: UserRole;
  province: Province;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CoachFilters = {
  search?: string;
  isActive?: boolean;
};

export type NewCoachData = {
  mobile: string;
  fullName: string;
  nationalCode: string;
  passwordHash: string;
  province: Province;
};

export type CoachUpdateData = {
  fullName?: string;
  mobile?: string;
  nationalCode?: string;
  isActive?: boolean;
};

export type CoachRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countCoaches(province: Province, filters: CoachFilters): Promise<number>;
  findCoaches(province: Province, filters: CoachFilters, skip: number, take: number): Promise<CoachRecord[]>;
  findCoachById(id: string): Promise<CoachRecord | null>;
  findMobileOwner(mobile: string): Promise<{ id: string } | null>;
  findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null>;
  createCoach(data: NewCoachData): Promise<CoachRecord>;
  updateCoach(id: string, data: CoachUpdateData): Promise<CoachRecord>;
};

const coachSelection = {
  id: true,
  mobile: true,
  fullName: true,
  nationalCode: true,
  role: true,
  province: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function coachWhere(province: Province, filters: CoachFilters) {
  return {
    role: "COACH" as const,
    province,
    ...(filters.isActive === undefined ? {} : { isActive: filters.isActive }),
    ...(filters.search === undefined
      ? {}
      : {
          OR: [{ fullName: { contains: filters.search, mode: "insensitive" as const } }, { mobile: { contains: filters.search } }],
        }),
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function countCoaches(province: Province, filters: CoachFilters): Promise<number> {
  return getPrisma().user.count({ where: coachWhere(province, filters) });
}

export async function findCoaches(province: Province, filters: CoachFilters, skip: number, take: number): Promise<CoachRecord[]> {
  return getPrisma().user.findMany({
    where: coachWhere(province, filters),
    select: coachSelection,
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });
}

export async function findCoachById(id: string): Promise<CoachRecord | null> {
  const user = await getPrisma().user.findUnique({ where: { id }, select: coachSelection });
  return user?.role === "COACH" ? user : null;
}

export async function findMobileOwner(mobile: string): Promise<{ id: string } | null> {
  return getPrisma().user.findUnique({ where: { mobile }, select: { id: true } });
}

export async function findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null> {
  return getPrisma().user.findUnique({ where: { nationalCode }, select: { id: true } });
}

export async function createCoach(data: NewCoachData): Promise<CoachRecord> {
  return getPrisma().user.create({
    data: {
      mobile: data.mobile,
      fullName: data.fullName,
      nationalCode: data.nationalCode,
      passwordHash: data.passwordHash,
      role: "COACH",
      province: data.province,
      isActive: true,
    },
    select: coachSelection,
  });
}

export async function updateCoach(id: string, data: CoachUpdateData): Promise<CoachRecord> {
  return getPrisma().user.update({ where: { id }, data, select: coachSelection });
}
