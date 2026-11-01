import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { County } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type CountiesRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findCountiesByProvince(province: Province): Promise<County[]>;
  findCountyById(id: string): Promise<County | null>;
};

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function findCountiesByProvince(province: Province): Promise<County[]> {
  return getPrisma().county.findMany({
    where: { province },
    select: { id: true, province: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function findCountyById(id: string): Promise<County | null> {
  return getPrisma().county.findUnique({ where: { id }, select: { id: true, province: true, name: true } });
}
