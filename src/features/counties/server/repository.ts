import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { County } from "../types";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
};

export type CountiesRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findCountiesByProvince(province: Province): Promise<County[]>;
  findAllCounties(province?: Province): Promise<County[]>;
  findCountyById(id: string): Promise<County | null>;
  countCountyCoaches(id: string): Promise<number>;
  countCountyCompetitions(id: string): Promise<number>;
  countCountyChangeRequests(id: string): Promise<number>;
  createCounty(data: { province: Province; name: string }): Promise<County>;
  updateCounty(id: string, data: { name: string }): Promise<County>;
  deleteCounty(id: string): Promise<void>;
};

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

const countySelection = { id: true, province: true, name: true } as const;

export async function findCountiesByProvince(province: Province): Promise<County[]> {
  return getPrisma().county.findMany({
    where: { province },
    select: countySelection,
    orderBy: { name: "asc" },
  });
}

export async function findAllCounties(province?: Province): Promise<County[]> {
  return getPrisma().county.findMany({
    where: province === undefined ? {} : { province },
    select: countySelection,
    orderBy: [{ province: "asc" }, { name: "asc" }],
  });
}

export async function findCountyById(id: string): Promise<County | null> {
  return getPrisma().county.findUnique({ where: { id }, select: countySelection });
}

export async function countCountyCoaches(id: string): Promise<number> {
  return getPrisma().user.count({ where: { countyId: id, role: "COACH" } });
}

export async function countCountyCompetitions(id: string): Promise<number> {
  return getPrisma().competitionCounty.count({ where: { countyId: id } });
}

export async function countCountyChangeRequests(id: string): Promise<number> {
  return getPrisma().coachCountyChangeRequest.count({ where: { OR: [{ fromCountyId: id }, { toCountyId: id }] } });
}

export async function createCounty(data: { province: Province; name: string }): Promise<County> {
  return getPrisma().county.create({ data, select: countySelection });
}

export async function updateCounty(id: string, data: { name: string }): Promise<County> {
  return getPrisma().county.update({ where: { id }, data, select: countySelection });
}

export async function deleteCounty(id: string): Promise<void> {
  await getPrisma().county.delete({ where: { id }, select: { id: true } });
}
