import type { Province } from "@/generated/client";
import type { Gender } from "@/generated/enums";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
};

export type CoachRecord = {
  id: string;
  mobile: string;
  fullName: string;
  nationalCode: string | null;
  role: UserRole;
  gender: Gender | null;
  province: Province;
  isActive: boolean;
  countyId: string | null;
  countyName: string | null;
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
  countyId: string;
  gender: Gender;
};

export type CoachUpdateData = {
  fullName?: string;
  mobile?: string;
  nationalCode?: string;
  isActive?: boolean;
  countyId?: string;
  gender?: Gender;
};

export type CountyRecord = {
  id: string;
  province: Province;
  name: string;
};

export type CoachRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countCoaches(province: Province | undefined, filters: CoachFilters): Promise<number>;
  findCoaches(province: Province | undefined, filters: CoachFilters, skip: number, take: number): Promise<CoachRecord[]>;
  findCoachById(id: string): Promise<CoachRecord | null>;
  findMobileOwner(mobile: string): Promise<{ id: string } | null>;
  findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null>;
  findCountyById(id: string): Promise<CountyRecord | null>;
  createCoach(data: NewCoachData): Promise<CoachRecord>;
  updateCoach(id: string, data: CoachUpdateData): Promise<CoachRecord>;
  updateCoachPassword(id: string, passwordHash: string): Promise<CoachRecord>;
  findActiveCoachTargets(province: Province): Promise<CoachTargetRow[]>;
  countStudentsByGender(coachId: string, gender: Gender): Promise<number>;
  findPhotoFileId(id: string): Promise<string | null>;
  setPhotoFileId(id: string, fileId: string | null): Promise<string | null>;
};

const coachSelection = {
  id: true,
  mobile: true,
  fullName: true,
  nationalCode: true,
  role: true,
  gender: true,
  province: true,
  isActive: true,
  county: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const;

type CoachRowInput = {
  id: string;
  mobile: string;
  fullName: string;
  nationalCode: string | null;
  role: UserRole;
  gender: Gender | null;
  province: Province | null;
  isActive: boolean;
  county: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CoachTargetRow = {
  id: string;
  fullName: string;
};

function toCoachRecord(row: CoachRowInput): CoachRecord {
  if (row.province === null) throw new Error("Coach user without province");

  return {
    id: row.id,
    mobile: row.mobile,
    fullName: row.fullName,
    nationalCode: row.nationalCode,
    role: row.role,
    gender: row.gender,
    province: row.province,
    isActive: row.isActive,
    countyId: row.county?.id ?? null,
    countyName: row.county?.name ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function coachWhere(province: Province | undefined, filters: CoachFilters) {
  return {
    role: "COACH" as const,
    ...(province === undefined ? {} : { province }),
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

export async function countCoaches(province: Province | undefined, filters: CoachFilters): Promise<number> {
  return getPrisma().user.count({ where: coachWhere(province, filters) });
}

export async function findCoaches(
  province: Province | undefined,
  filters: CoachFilters,
  skip: number,
  take: number,
): Promise<CoachRecord[]> {
  const rows = await getPrisma().user.findMany({
    where: coachWhere(province, filters),
    select: coachSelection,
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });

  return rows.map(toCoachRecord);
}

// Minimal coach directory for request forms (coach change, province change):
// only active coaches of one province, only id and name.
export async function findActiveCoachTargets(province: Province): Promise<CoachTargetRow[]> {
  const rows = await getPrisma().user.findMany({
    where: { role: "COACH", province, isActive: true },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return rows;
}

export async function findCoachById(id: string): Promise<CoachRecord | null> {
  const user = await getPrisma().user.findUnique({ where: { id }, select: coachSelection });
  return user && user.role === "COACH" ? toCoachRecord(user) : null;
}

export async function findMobileOwner(mobile: string): Promise<{ id: string } | null> {
  return getPrisma().user.findUnique({ where: { mobile }, select: { id: true } });
}

export async function findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null> {
  return getPrisma().user.findUnique({ where: { nationalCode }, select: { id: true } });
}

export async function findCountyById(id: string): Promise<CountyRecord | null> {
  return getPrisma().county.findUnique({ where: { id }, select: { id: true, province: true, name: true } });
}

export async function createCoach(data: NewCoachData): Promise<CoachRecord> {
  const user = await getPrisma().user.create({
    data: {
      mobile: data.mobile,
      fullName: data.fullName,
      nationalCode: data.nationalCode,
      passwordHash: data.passwordHash,
      role: "COACH",
      gender: data.gender,
      province: data.province,
      isActive: true,
      countyId: data.countyId,
    },
    select: coachSelection,
  });

  return toCoachRecord(user);
}

export async function updateCoach(id: string, data: CoachUpdateData): Promise<CoachRecord> {
  const user = await getPrisma().user.update({ where: { id }, data, select: coachSelection });

  return toCoachRecord(user);
}

export async function updateCoachPassword(id: string, passwordHash: string): Promise<CoachRecord> {
  const user = await getPrisma().user.update({ where: { id }, data: { passwordHash }, select: coachSelection });

  return toCoachRecord(user);
}

export async function countStudentsByGender(coachId: string, gender: Gender): Promise<number> {
  return getPrisma().student.count({ where: { coachId, gender } });
}

export async function findPhotoFileId(id: string): Promise<string | null> {
  const row = await getPrisma().user.findUnique({ where: { id }, select: { photoFileId: true } });
  return row?.photoFileId ?? null;
}

export async function setPhotoFileId(id: string, fileId: string | null): Promise<string | null> {
  return getPrisma().$transaction(async (tx) => {
    const row = await tx.user.findUnique({ where: { id }, select: { photoFileId: true } });
    if (row === null) return null;

    await tx.user.update({ where: { id }, data: { photoFileId: fileId }, select: { id: true } });

    return row.photoFileId;
  });
}
