import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province | null;
  isActive: boolean;
};

export type PhotoChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

// One row of the review queue: the pending (or decided) photo swap for a
// student. The current PHOTO document is resolved with the query so the admin
// can compare old and new photos side by side.
export type PhotoChangeRow = {
  id: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  coachProvince: Province | null;
  hasCurrentPhoto: boolean;
  newFileId: string;
  status: PhotoChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

export type PhotoChangeFilters = {
  status?: PhotoChangeStatus;
  province?: Province;
  coachId?: string;
};

export type DecidePhotoChangeInput = {
  status: Exclude<PhotoChangeStatus, "PENDING">;
  note: string | null;
  decidedById: string;
};

export type DecidePhotoChangeResult = {
  row: PhotoChangeRow;
  // File id of the previous PHOTO document, so the service can remove the
  // replaced object from storage after the commit. Null when the student had
  // no photo yet.
  replacedFileId: string | null;
};

export type PhotoChangeRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findStudentById(id: string): Promise<{ id: string; fullName: string; coachId: string; coachProvince: Province | null } | null>;
  findPendingPhotoChangeByStudentId(studentId: string): Promise<PhotoChangeRow | null>;
  createPhotoChange(data: { studentId: string; newFileId: string }): Promise<PhotoChangeRow>;
  countPhotoChanges(filters: PhotoChangeFilters): Promise<number>;
  findPhotoChanges(filters: PhotoChangeFilters, skip: number, take: number): Promise<PhotoChangeRow[]>;
  findPhotoChangeById(id: string): Promise<PhotoChangeRow | null>;
  decidePhotoChangeFromPending(id: string, input: DecidePhotoChangeInput): Promise<DecidePhotoChangeResult | null>;
  findPhotoChangeFileId(id: string): Promise<{ fileId: string; studentCoachId: string; studentCoachProvince: Province | null } | null>;
};

const photoChangeSelection = {
  id: true,
  status: true,
  note: true,
  decidedAt: true,
  createdAt: true,
  newFileId: true,
  student: {
    select: {
      id: true,
      fullName: true,
      coach: { select: { id: true, fullName: true, province: true } },
      documents: { where: { type: "PHOTO" as const }, select: { fileId: true }, take: 1 },
    },
  },
} as const;

type PhotoChangeRowInput = {
  id: string;
  status: PhotoChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  newFileId: string;
  student: {
    id: string;
    fullName: string;
    coach: { id: string; fullName: string; province: Province | null };
    documents: Array<{ fileId: string }>;
  };
};

function toPhotoChangeRow(row: PhotoChangeRowInput): PhotoChangeRow {
  return {
    id: row.id,
    studentId: row.student.id,
    studentName: row.student.fullName,
    coachId: row.student.coach.id,
    coachName: row.student.coach.fullName,
    coachProvince: row.student.coach.province,
    hasCurrentPhoto: row.student.documents.length > 0,
    newFileId: row.newFileId,
    status: row.status,
    note: row.note,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({ where: { id }, select: { id: true, role: true, province: true, isActive: true } });
}

export async function findStudentById(id: string) {
  const row = await getPrisma().student.findUnique({
    where: { id },
    select: { id: true, fullName: true, coachId: true, coach: { select: { province: true } } },
  });
  if (row === null) return null;

  return { id: row.id, fullName: row.fullName, coachId: row.coachId, coachProvince: row.coach.province };
}

export async function findPendingPhotoChangeByStudentId(studentId: string): Promise<PhotoChangeRow | null> {
  const row = await getPrisma().studentPhotoChangeRequest.findFirst({
    where: { studentId, status: "PENDING" },
    select: photoChangeSelection,
    orderBy: { createdAt: "desc" },
  });

  return row === null ? null : toPhotoChangeRow(row);
}

export async function createPhotoChange(data: { studentId: string; newFileId: string }): Promise<PhotoChangeRow> {
  const row = await getPrisma().studentPhotoChangeRequest.create({
    data: { studentId: data.studentId, newFileId: data.newFileId },
    select: photoChangeSelection,
  });

  return toPhotoChangeRow(row);
}

function photoChangeWhere(filters: PhotoChangeFilters) {
  return {
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.coachId === undefined ? {} : { student: { coachId: filters.coachId } }),
    ...(filters.province === undefined ? {} : { student: { coach: { province: filters.province } } }),
  };
}

export async function countPhotoChanges(filters: PhotoChangeFilters): Promise<number> {
  return getPrisma().studentPhotoChangeRequest.count({ where: photoChangeWhere(filters) });
}

export async function findPhotoChanges(filters: PhotoChangeFilters, skip: number, take: number): Promise<PhotoChangeRow[]> {
  const rows = await getPrisma().studentPhotoChangeRequest.findMany({
    where: photoChangeWhere(filters),
    select: photoChangeSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map(toPhotoChangeRow);
}

export async function findPhotoChangeById(id: string): Promise<PhotoChangeRow | null> {
  const row = await getPrisma().studentPhotoChangeRequest.findUnique({ where: { id }, select: photoChangeSelection });

  return row === null ? null : toPhotoChangeRow(row);
}

export async function decidePhotoChangeFromPending(id: string, input: DecidePhotoChangeInput): Promise<DecidePhotoChangeResult | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.studentPhotoChangeRequest.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: input.status,
        note: input.note,
        decidedById: input.decidedById,
        decidedAt: new Date(),
      },
    });
    if (applied.count === 0) return null;

    let replacedFileId: string | null = null;
    if (input.status === "APPROVED") {
      const row = await tx.studentPhotoChangeRequest.findUnique({
        where: { id },
        select: { studentId: true, newFileId: true },
      });
      if (row) {
        const current = await tx.studentDocument.findUnique({
          where: { studentId_type: { studentId: row.studentId, type: "PHOTO" } },
          select: { fileId: true },
        });
        replacedFileId = current?.fileId ?? null;

        await tx.studentDocument.upsert({
          where: { studentId_type: { studentId: row.studentId, type: "PHOTO" } },
          create: { studentId: row.studentId, type: "PHOTO", fileId: row.newFileId },
          update: { fileId: row.newFileId },
        });
      }
    }

    const updated = await tx.studentPhotoChangeRequest.findUnique({ where: { id }, select: photoChangeSelection });
    if (updated === null) return null;

    return { row: toPhotoChangeRow(updated), replacedFileId };
  });
}

export async function findPhotoChangeFileId(id: string) {
  const row = await getPrisma().studentPhotoChangeRequest.findUnique({
    where: { id },
    select: {
      newFileId: true,
      student: { select: { coachId: true, coach: { select: { province: true } } } },
    },
  });
  if (row === null) return null;

  return { fileId: row.newFileId, studentCoachId: row.student.coachId, studentCoachProvince: row.student.coach.province };
}
