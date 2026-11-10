import type { Gender } from "@/features/base-data";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
};

export type ProvinceChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

export type StudentMoveLookupRow = {
  id: string;
  fullName: string;
  gender: Gender;
  coachId: string;
  coachName: string;
  coachProvince: Province | null;
};

export type CoachTargetRow = {
  id: string;
  fullName: string;
  province: Province | null;
  isActive: boolean;
  gender: Gender | null;
};

export type ProvinceChangeRow = {
  id: string;
  studentId: string;
  studentName: string;
  fromCoachId: string;
  fromCoachName: string;
  fromProvince: Province;
  toProvince: Province;
  toCoachId: string;
  toCoachName: string;
  status: ProvinceChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

export type ProvinceChangeFilters = {
  status?: ProvinceChangeStatus;
  toProvince?: Province;
  fromCoachId?: string;
};

export type DecideProvinceChangeInput = {
  status: Exclude<ProvinceChangeStatus, "PENDING">;
  note: string | null;
  decidedById: string;
};

export type ProvinceChangeRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findStudentForMove(id: string): Promise<StudentMoveLookupRow | null>;
  findCoachTargetById(id: string): Promise<CoachTargetRow | null>;
  hasPendingMoveRequest(studentId: string): Promise<boolean>;
  createProvinceChange(data: {
    studentId: string;
    fromCoachId: string;
    fromProvince: Province;
    toProvince: Province;
    toCoachId: string;
  }): Promise<ProvinceChangeRow>;
  countProvinceChanges(filters: ProvinceChangeFilters): Promise<number>;
  findProvinceChanges(filters: ProvinceChangeFilters, skip: number, take: number): Promise<ProvinceChangeRow[]>;
  findProvinceChangeById(id: string): Promise<ProvinceChangeRow | null>;
  decideProvinceChangeFromPending(id: string, input: DecideProvinceChangeInput): Promise<ProvinceChangeRow | null>;
};

const provinceChangeSelection = {
  id: true,
  status: true,
  note: true,
  decidedAt: true,
  createdAt: true,
  fromProvince: true,
  toProvince: true,
  student: { select: { id: true, fullName: true } },
  fromCoach: { select: { id: true, fullName: true } },
  toCoach: { select: { id: true, fullName: true } },
} as const;

type ProvinceChangeRowInput = {
  id: string;
  status: ProvinceChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  fromProvince: Province;
  toProvince: Province;
  student: { id: string; fullName: string };
  fromCoach: { id: string; fullName: string };
  toCoach: { id: string; fullName: string };
};

function toProvinceChangeRow(row: ProvinceChangeRowInput): ProvinceChangeRow {
  return {
    id: row.id,
    studentId: row.student.id,
    studentName: row.student.fullName,
    fromCoachId: row.fromCoach.id,
    fromCoachName: row.fromCoach.fullName,
    fromProvince: row.fromProvince,
    toProvince: row.toProvince,
    toCoachId: row.toCoach.id,
    toCoachName: row.toCoach.fullName,
    status: row.status,
    note: row.note,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({ where: { id }, select: { id: true, role: true, province: true, isActive: true } });
}

export async function findStudentForMove(id: string): Promise<StudentMoveLookupRow | null> {
  const row = await getPrisma().student.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      gender: true,
      coachId: true,
      coach: { select: { fullName: true, province: true } },
    },
  });
  if (row === null) return null;

  return {
    id: row.id,
    fullName: row.fullName,
    gender: row.gender,
    coachId: row.coachId,
    coachName: row.coach.fullName,
    coachProvince: row.coach.province,
  };
}

export async function findCoachTargetById(id: string): Promise<CoachTargetRow | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, fullName: true, province: true, isActive: true, gender: true },
  });
}

// One pending request at a time across BOTH move request types, otherwise two
// approvals could race on the same student ownership.
export async function hasPendingMoveRequest(studentId: string): Promise<boolean> {
  const [transfer, provinceChange] = await Promise.all([
    getPrisma().studentTransfer.findFirst({ where: { studentId, status: "PENDING" }, select: { id: true } }),
    getPrisma().studentProvinceChangeRequest.findFirst({ where: { studentId, status: "PENDING" }, select: { id: true } }),
  ]);

  return transfer !== null || provinceChange !== null;
}

export async function createProvinceChange(data: {
  studentId: string;
  fromCoachId: string;
  fromProvince: Province;
  toProvince: Province;
  toCoachId: string;
}): Promise<ProvinceChangeRow> {
  const row = await getPrisma().studentProvinceChangeRequest.create({
    data: {
      studentId: data.studentId,
      fromCoachId: data.fromCoachId,
      fromProvince: data.fromProvince,
      toProvince: data.toProvince,
      toCoachId: data.toCoachId,
    },
    select: provinceChangeSelection,
  });

  return toProvinceChangeRow(row);
}

function provinceChangeWhere(filters: ProvinceChangeFilters) {
  return {
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.toProvince === undefined ? {} : { toProvince: filters.toProvince }),
    ...(filters.fromCoachId === undefined ? {} : { fromCoachId: filters.fromCoachId }),
  };
}

export async function countProvinceChanges(filters: ProvinceChangeFilters): Promise<number> {
  return getPrisma().studentProvinceChangeRequest.count({ where: provinceChangeWhere(filters) });
}

export async function findProvinceChanges(filters: ProvinceChangeFilters, skip: number, take: number): Promise<ProvinceChangeRow[]> {
  const rows = await getPrisma().studentProvinceChangeRequest.findMany({
    where: provinceChangeWhere(filters),
    select: provinceChangeSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map(toProvinceChangeRow);
}

export async function findProvinceChangeById(id: string): Promise<ProvinceChangeRow | null> {
  const row = await getPrisma().studentProvinceChangeRequest.findUnique({ where: { id }, select: provinceChangeSelection });

  return row === null ? null : toProvinceChangeRow(row);
}

export class ProvinceChangeOwnerChangedError extends Error {
  constructor() {
    super("student owner changed since the request was created");
  }
}

export class ProvinceChangeGenderMismatchError extends Error {
  constructor() {
    super("student gender does not match the target coach gender");
  }
}

export async function decideProvinceChangeFromPending(id: string, input: DecideProvinceChangeInput): Promise<ProvinceChangeRow | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.studentProvinceChangeRequest.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: input.status,
        note: input.note,
        decidedById: input.decidedById,
        decidedAt: new Date(),
      },
    });
    if (applied.count === 0) return null;

    if (input.status === "APPROVED") {
      const row = await tx.studentProvinceChangeRequest.findUnique({
        where: { id },
        select: {
          studentId: true,
          fromCoachId: true,
          toCoachId: true,
          student: { select: { gender: true } },
          toCoach: { select: { gender: true } },
        },
      });
      if (row) {
        if (row.toCoach.gender === null || row.student.gender !== row.toCoach.gender) {
          throw new ProvinceChangeGenderMismatchError();
        }

        const moved = await tx.student.updateMany({
          where: { id: row.studentId, coachId: row.fromCoachId },
          data: { coachId: row.toCoachId },
        });
        if (moved.count === 0) {
          throw new ProvinceChangeOwnerChangedError();
        }
      }
    }

    const updated = await tx.studentProvinceChangeRequest.findUnique({ where: { id }, select: provinceChangeSelection });
    if (updated === null) return null;

    return toProvinceChangeRow(updated);
  });
}
