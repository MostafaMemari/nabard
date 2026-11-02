import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { TransferStatus } from "../types";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
  countyId: string | null;
};

export type StudentLookupRow = {
  id: string;
  fullName: string;
  coachId: string;
  coachName: string;
  coachProvince: Province | null;
};

export type CoachTargetRow = {
  id: string;
  fullName: string;
  province: Province | null;
  isActive: boolean;
};

export type TransferRow = {
  id: string;
  studentId: string;
  studentName: string;
  fromCoachId: string;
  fromCoachName: string;
  toCoachId: string;
  toCoachName: string;
  status: TransferStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

export type TransferWithScope = TransferRow & {
  fromCoachProvince: Province | null;
  toCoachProvince: Province | null;
};

export type CoachTransferRow = TransferRow & {
  fromCoachProvince: Province | null;
};

export type TransferFilters = {
  status?: TransferStatus;
  province?: Province;
  coachId?: string;
};

export type CreateTransferData = {
  studentId: string;
  fromCoachId: string;
  toCoachId: string;
};

export type DecideTransferInput = {
  status: Exclude<TransferStatus, "PENDING">;
  note: string | null;
  decidedById: string;
};

export type TransfersRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findStudentByNationalCode(nationalCode: string): Promise<StudentLookupRow | null>;
  findPendingTransferByStudentId(studentId: string): Promise<TransferRow | null>;
  createTransfer(data: CreateTransferData): Promise<TransferRow>;
  countTransfers(filters: TransferFilters): Promise<number>;
  findTransfers(filters: TransferFilters, skip: number, take: number): Promise<TransferWithScope[]>;
  findTransferById(id: string): Promise<TransferWithScope | null>;
  decideTransferFromPending(id: string, input: DecideTransferInput): Promise<TransferWithScope | null>;
  findCoachTargetById(id: string): Promise<CoachTargetRow | null>;
  countCoachStudents(coachId: string): Promise<number>;
  countCoachTransfers(coachId: string, filters: { status?: TransferStatus }): Promise<number>;
  findCoachTransfers(coachId: string, filters: { status?: TransferStatus }, skip: number, take: number): Promise<CoachTransferRow[]>;
  reassignCoachStudents(fromCoachId: string, toCoachId: string): Promise<number>;
};

const transferSelection = {
  id: true,
  status: true,
  note: true,
  decidedAt: true,
  createdAt: true,
  student: { select: { id: true, fullName: true } },
  fromCoach: { select: { id: true, fullName: true, province: true } },
  toCoach: { select: { id: true, fullName: true, province: true } },
} as const;

type TransferRowInput = {
  id: string;
  status: TransferStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  student: { id: string; fullName: string };
  fromCoach: { id: string; fullName: string; province: Province | null };
  toCoach: { id: string; fullName: string; province: Province | null };
};

function toTransferRow(row: TransferRowInput): TransferWithScope {
  return {
    id: row.id,
    studentId: row.student.id,
    studentName: row.student.fullName,
    fromCoachId: row.fromCoach.id,
    fromCoachName: row.fromCoach.fullName,
    toCoachId: row.toCoach.id,
    toCoachName: row.toCoach.fullName,
    status: row.status,
    note: row.note,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
    fromCoachProvince: row.fromCoach.province,
    toCoachProvince: row.toCoach.province,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true, countyId: true },
  });
}

export async function findStudentByNationalCode(nationalCode: string): Promise<StudentLookupRow | null> {
  const row = await getPrisma().student.findUnique({
    where: { nationalCode },
    select: { id: true, fullName: true, coach: { select: { id: true, fullName: true, province: true } } },
  });
  if (row === null) return null;

  return {
    id: row.id,
    fullName: row.fullName,
    coachId: row.coach.id,
    coachName: row.coach.fullName,
    coachProvince: row.coach.province,
  };
}

export async function findPendingTransferByStudentId(studentId: string): Promise<TransferRow | null> {
  const row = await getPrisma().studentTransfer.findFirst({
    where: { studentId, status: "PENDING" },
    select: {
      id: true,
      status: true,
      note: true,
      decidedAt: true,
      createdAt: true,
      student: { select: { id: true, fullName: true } },
      fromCoach: { select: { id: true, fullName: true, province: true } },
      toCoach: { select: { id: true, fullName: true, province: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return row === null ? null : toTransferRow(row);
}

export async function createTransfer(data: CreateTransferData): Promise<TransferRow> {
  const row = await getPrisma().studentTransfer.create({
    data: { studentId: data.studentId, fromCoachId: data.fromCoachId, toCoachId: data.toCoachId },
    select: transferSelection,
  });

  return toTransferRow(row);
}

function transferWhere(filters: TransferFilters) {
  return {
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.province === undefined ? {} : { fromCoach: { province: filters.province } }),
    ...(filters.coachId === undefined ? {} : { OR: [{ fromCoachId: filters.coachId }, { toCoachId: filters.coachId }] }),
  };
}

export async function countTransfers(filters: TransferFilters): Promise<number> {
  return getPrisma().studentTransfer.count({ where: transferWhere(filters) });
}

export async function findTransfers(filters: TransferFilters, skip: number, take: number): Promise<TransferWithScope[]> {
  const rows = await getPrisma().studentTransfer.findMany({
    where: transferWhere(filters),
    select: transferSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map(toTransferRow);
}

export async function findCoachTransfers(
  coachId: string,
  filters: { status?: TransferStatus },
  skip: number,
  take: number,
): Promise<CoachTransferRow[]> {
  const rows = await getPrisma().studentTransfer.findMany({
    where: { ...(filters.status === undefined ? {} : { status: filters.status }), OR: [{ fromCoachId: coachId }, { toCoachId: coachId }] },
    select: transferSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map((row) => ({ ...toTransferRow(row), fromCoachProvince: row.fromCoach.province }));
}

export async function countCoachTransfers(coachId: string, filters: { status?: TransferStatus }): Promise<number> {
  return getPrisma().studentTransfer.count({
    where: { ...(filters.status === undefined ? {} : { status: filters.status }), OR: [{ fromCoachId: coachId }, { toCoachId: coachId }] },
  });
}

export async function findTransferById(id: string): Promise<TransferWithScope | null> {
  const row = await getPrisma().studentTransfer.findUnique({ where: { id }, select: transferSelection });

  return row === null ? null : toTransferRow(row);
}

export class StudentOwnerChangedError extends Error {
  constructor() {
    super("student owner changed since the request was created");
  }
}

export async function decideTransferFromPending(id: string, input: DecideTransferInput): Promise<TransferWithScope | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.studentTransfer.updateMany({
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
      const row = await tx.studentTransfer.findUnique({
        where: { id },
        select: { studentId: true, fromCoachId: true, toCoachId: true },
      });
      if (row) {
        const moved = await tx.student.updateMany({
          where: { id: row.studentId, coachId: row.fromCoachId },
          data: { coachId: row.toCoachId },
        });
        if (moved.count === 0) {
          throw new StudentOwnerChangedError();
        }
      }
    }

    const updated = await tx.studentTransfer.findUnique({ where: { id }, select: transferSelection });
    if (updated === null) return null;

    return toTransferRow(updated);
  });
}

export async function findCoachTargetById(id: string): Promise<CoachTargetRow | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, fullName: true, province: true, isActive: true },
  });
}

export async function countCoachStudents(coachId: string): Promise<number> {
  return getPrisma().student.count({ where: { coachId } });
}

export async function reassignCoachStudents(fromCoachId: string, toCoachId: string): Promise<number> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.student.updateMany({
      where: { coachId: fromCoachId },
      data: { coachId: toCoachId },
    });

    return applied.count;
  });
}
