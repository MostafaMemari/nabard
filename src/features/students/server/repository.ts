import type { Gender } from "@/features/base-data";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
};

export type StudentRecord = {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: Date;
  weightKg: number | null;
  beltId: string;
  coachId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentWithCoach = StudentRecord & { coachProvince: Province };

export type StudentFilters = {
  coachId?: string;
  province?: Province;
  gender?: Gender;
  beltId?: string;
  search?: string;
};

export type NewStudentData = {
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: Date;
  weightKg: number | null;
  beltId: string;
  coachId: string;
};

export type StudentUpdateData = {
  fullName?: string;
  gender?: Gender;
  nationalCode?: string;
  birthDate?: Date;
  weightKg?: number | null;
  beltId?: string;
};

export type StudentRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countStudents(filters: StudentFilters): Promise<number>;
  findStudents(filters: StudentFilters, skip: number, take: number): Promise<StudentRecord[]>;
  findStudentById(id: string): Promise<StudentWithCoach | null>;
  findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null>;
  beltExists(beltId: string): Promise<boolean>;
  countRegistrations(studentId: string): Promise<number>;
  createStudent(data: NewStudentData): Promise<StudentRecord>;
  updateStudent(id: string, data: StudentUpdateData): Promise<StudentRecord>;
  deleteStudent(id: string): Promise<void>;
};

const studentSelection = {
  id: true,
  fullName: true,
  gender: true,
  nationalCode: true,
  birthDate: true,
  weightKg: true,
  beltId: true,
  coachId: true,
  createdAt: true,
  updatedAt: true,
} as const;

function studentWhere(filters: StudentFilters) {
  return {
    ...(filters.coachId === undefined ? {} : { coachId: filters.coachId }),
    ...(filters.province === undefined ? {} : { coach: { province: filters.province } }),
    ...(filters.gender === undefined ? {} : { gender: filters.gender }),
    ...(filters.beltId === undefined ? {} : { beltId: filters.beltId }),
    ...(filters.search === undefined
      ? {}
      : {
          OR: [{ fullName: { contains: filters.search, mode: "insensitive" as const } }, { nationalCode: { contains: filters.search } }],
        }),
  };
}

function toStudentRecord(row: {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: Date;
  weightKg: { toString(): string } | null;
  beltId: string;
  coachId: string;
  createdAt: Date;
  updatedAt: Date;
}): StudentRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    gender: row.gender,
    nationalCode: row.nationalCode,
    birthDate: row.birthDate,
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
    beltId: row.beltId,
    coachId: row.coachId,
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

export async function countStudents(filters: StudentFilters): Promise<number> {
  return getPrisma().student.count({ where: studentWhere(filters) });
}

export async function findStudents(filters: StudentFilters, skip: number, take: number): Promise<StudentRecord[]> {
  const rows = await getPrisma().student.findMany({
    where: studentWhere(filters),
    select: studentSelection,
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });

  return rows.map(toStudentRecord);
}

export async function findStudentById(id: string): Promise<StudentWithCoach | null> {
  const row = await getPrisma().student.findUnique({
    where: { id },
    select: { ...studentSelection, coach: { select: { province: true } } },
  });

  return row === null ? null : { ...toStudentRecord(row), coachProvince: row.coach.province };
}

export async function findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null> {
  return getPrisma().student.findUnique({ where: { nationalCode }, select: { id: true } });
}

export async function beltExists(beltId: string): Promise<boolean> {
  const belt = await getPrisma().belt.findUnique({ where: { id: beltId }, select: { id: true } });
  return belt !== null;
}

export async function countRegistrations(studentId: string): Promise<number> {
  return getPrisma().registration.count({ where: { studentId } });
}

export async function createStudent(data: NewStudentData): Promise<StudentRecord> {
  const row = await getPrisma().student.create({
    data: {
      fullName: data.fullName,
      gender: data.gender,
      nationalCode: data.nationalCode,
      birthDate: data.birthDate,
      weightKg: data.weightKg,
      beltId: data.beltId,
      coachId: data.coachId,
    },
    select: studentSelection,
  });

  return toStudentRecord(row);
}

export async function updateStudent(id: string, data: StudentUpdateData): Promise<StudentRecord> {
  const row = await getPrisma().student.update({ where: { id }, data, select: studentSelection });
  return toStudentRecord(row);
}

export async function deleteStudent(id: string): Promise<void> {
  await getPrisma().student.delete({ where: { id }, select: { id: true } });
}
