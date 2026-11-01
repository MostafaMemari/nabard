import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { AgeCategoryRecord } from "./repository";

export type UserIdentityRecord = {
  id: string;
  role: "ADMIN" | "COACH" | "SUPER_ADMIN";
  province: Province | null;
  isActive: boolean;
};

function toRecord(category: {
  id: string;
  name: AgeCategoryRecord["name"];
  startDate: Date;
  endDate: Date;
  birthYearStart: number | null;
  birthYearEnd: number | null;
}): AgeCategoryRecord {
  return {
    id: category.id,
    name: category.name,
    startDate: category.startDate,
    endDate: category.endDate,
    birthYearStart: category.birthYearStart,
    birthYearEnd: category.birthYearEnd,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function findAgeCategoryById(id: string): Promise<AgeCategoryRecord | null> {
  const category = await getPrisma().ageCategory.findUnique({ where: { id } });

  return category === null ? null : toRecord(category);
}

export async function countPublishedCompetitionRegistrations(ageCategoryId: string): Promise<number> {
  return getPrisma().registration.count({
    where: { competition: { ageCategoryId, status: "PUBLISHED" } },
  });
}

export async function updateAgeCategoryDates(id: string, data: { startDate: Date; endDate: Date }): Promise<AgeCategoryRecord> {
  const category = await getPrisma().ageCategory.update({
    where: { id },
    data,
    select: { id: true, name: true, startDate: true, endDate: true, birthYearStart: true, birthYearEnd: true },
  });

  return toRecord(category);
}
