import type { Gender } from "@/features/base-data";
import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  gender: Gender | null;
  province: Province | null;
  isActive: boolean;
};

export type ProfileStatus = "PENDING" | "APPROVED" | "REJECTED";

export type StudentDocumentType = "PHOTO" | "NATIONAL_ID_OR_BIRTH_CERTIFICATE" | "INSURANCE" | "BELT_CERTIFICATE";

// Only the personal photo is offered any more; the older types stay valid so
// existing rows keep rendering, but they can no longer be uploaded or deleted.
export const STUDENT_DOCUMENT_TYPES: StudentDocumentType[] = ["PHOTO"];

export function isStudentDocumentType(value: string): value is StudentDocumentType {
  return (STUDENT_DOCUMENT_TYPES as string[]).includes(value);
}

export type StudentRecord = {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: Date;
  mobile: string | null;
  insuranceDate: Date | null;
  tkdBankChargeDate: Date | null;
  beltCertificateDate: Date | null;
  beltId: string;
  coachId: string;
  profileStatus: ProfileStatus;
  profileNote: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Internal: stored file id behind the PHOTO document. Only populated by
  // list/detail queries; the service turns it into a display URL.
  photoFileId?: string | null;
  // Display URL for the photo: the direct public R2 url. Filled in by the
  // service; null when the file is not on R2.
  photoUrl?: string | null;
};

export type StudentDocumentRecord = {
  id: string;
  studentId: string;
  type: StudentDocumentType;
  fileId: string;
  createdAt: Date;
  // Direct display url, filled in by the service layer. Null when the file is
  // not on R2 (local development without R2 env vars).
  url?: string | null;
};

export type PendingReviewStudent = StudentRecord & { coachName: string; documents: StudentDocumentRecord[] };

export type StudentDetail = StudentRecord & { coachName: string; documents: StudentDocumentRecord[] };

export type StudentWithCoach = StudentRecord & { coachProvince: Province | null; coachName: string };

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
  mobile: string;
  beltCertificateDate: Date | null;
  insuranceDate: Date | null;
  tkdBankChargeDate: Date | null;
  beltId: string;
  coachId: string;
};

export type StudentUpdateData = {
  beltId: string;
};

export type PendingReviewFilters = {
  province: Province;
  status?: ProfileStatus;
};

export type ProfileReviewInput = {
  status: "APPROVED" | "REJECTED";
  note: string | null;
  reviewedById: string;
};

export type StudentRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  countStudents(filters: StudentFilters): Promise<number>;
  findStudents(filters: StudentFilters, skip: number, take: number): Promise<StudentRecord[]>;
  findStudentById(id: string): Promise<StudentWithCoach | null>;
  findStudentDocuments(studentId: string): Promise<StudentDocumentRecord[]>;
  findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null>;
  activeBeltExists(beltId: string): Promise<boolean>;
  beltExists(beltId: string): Promise<boolean>;
  countRegistrations(studentId: string): Promise<number>;
  countStudentTransfers(studentId: string): Promise<number>;
  createStudent(data: NewStudentData): Promise<StudentRecord>;
  updateStudent(id: string, data: StudentUpdateData): Promise<StudentRecord>;
  deleteStudent(id: string): Promise<string[]>;
  countPendingReviewStudents(filters: PendingReviewFilters): Promise<number>;
  findPendingReviewStudents(filters: PendingReviewFilters, skip: number, take: number): Promise<PendingReviewStudent[]>;
  updateProfileStatusFromPendingOrRejected(id: string, input: ProfileReviewInput): Promise<StudentRecord | null>;
  findStudentDocument(studentId: string, type: StudentDocumentType): Promise<StudentDocumentRecord | null>;
  countStudentPhotoChangeRequests(studentId: string): Promise<number>;
  countStudentProvinceChangeRequests(studentId: string): Promise<number>;
};

const studentSelection = {
  id: true,
  fullName: true,
  gender: true,
  nationalCode: true,
  birthDate: true,
  mobile: true,
  insuranceDate: true,
  tkdBankChargeDate: true,
  beltCertificateDate: true,
  beltId: true,
  coachId: true,
  profileStatus: true,
  profileNote: true,
  approvedAt: true,
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
  mobile: string | null;
  insuranceDate: Date | null;
  tkdBankChargeDate: Date | null;
  beltCertificateDate: Date | null;
  beltId: string;
  coachId: string;
  profileStatus: ProfileStatus;
  profileNote: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): StudentRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    gender: row.gender,
    nationalCode: row.nationalCode,
    birthDate: row.birthDate,
    mobile: row.mobile,
    insuranceDate: row.insuranceDate,
    tkdBankChargeDate: row.tkdBankChargeDate,
    beltCertificateDate: row.beltCertificateDate,
    beltId: row.beltId,
    coachId: row.coachId,
    profileStatus: row.profileStatus,
    profileNote: row.profileNote,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, gender: true, province: true, isActive: true },
  });
}

export async function countStudents(filters: StudentFilters): Promise<number> {
  return getPrisma().student.count({ where: studentWhere(filters) });
}

export async function findStudents(filters: StudentFilters, skip: number, take: number): Promise<StudentRecord[]> {
  const rows = await getPrisma().student.findMany({
    where: studentWhere(filters),
    select: {
      ...studentSelection,
      documents: { where: { type: "PHOTO" }, select: { fileId: true }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });

  return rows.map((row) => ({ ...toStudentRecord(row), photoFileId: row.documents[0]?.fileId ?? null }));
}

export async function findStudentById(id: string): Promise<StudentWithCoach | null> {
  const row = await getPrisma().student.findUnique({
    where: { id },
    select: { ...studentSelection, coach: { select: { province: true, fullName: true } } },
  });

  return row === null ? null : { ...toStudentRecord(row), coachProvince: row.coach.province, coachName: row.coach.fullName };
}

export async function findStudentDocuments(studentId: string): Promise<StudentDocumentRecord[]> {
  const rows = await getPrisma().studentDocument.findMany({
    where: { studentId },
    select: documentSelection,
    orderBy: { createdAt: "asc" },
  });

  return rows.map(toDocumentRecord);
}

export async function findNationalCodeOwner(nationalCode: string): Promise<{ id: string } | null> {
  return getPrisma().student.findUnique({ where: { nationalCode }, select: { id: true } });
}

export async function activeBeltExists(beltId: string): Promise<boolean> {
  const belt = await getPrisma().belt.findUnique({ where: { id: beltId }, select: { isActive: true } });
  return belt?.isActive === true;
}

export async function beltExists(beltId: string): Promise<boolean> {
  const belt = await getPrisma().belt.findUnique({ where: { id: beltId }, select: { id: true } });
  return belt !== null;
}

export async function countRegistrations(studentId: string): Promise<number> {
  return getPrisma().registration.count({ where: { studentId } });
}

export async function countStudentTransfers(studentId: string): Promise<number> {
  return getPrisma().studentTransfer.count({ where: { studentId } });
}

export async function createStudent(data: NewStudentData): Promise<StudentRecord> {
  const row = await getPrisma().student.create({
    data: {
      fullName: data.fullName,
      gender: data.gender,
      nationalCode: data.nationalCode,
      birthDate: data.birthDate,
      mobile: data.mobile,
      insuranceDate: data.insuranceDate,
      tkdBankChargeDate: data.tkdBankChargeDate,
      beltCertificateDate: data.beltCertificateDate,
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

// Documents reference stored files with ON DELETE RESTRICT, so the document
// rows and the student must go in one transaction. The stored file metadata
// rows (and the R2 objects behind them) are removed by the service after the
// commit, dispatched on the file provider.
export async function deleteStudent(id: string): Promise<string[]> {
  return getPrisma().$transaction(async (tx) => {
    const documents = await tx.studentDocument.findMany({ where: { studentId: id }, select: { fileId: true } });
    await tx.studentDocument.deleteMany({ where: { studentId: id } });
    await tx.student.delete({ where: { id }, select: { id: true } });

    return documents.map((document) => document.fileId);
  });
}

const documentSelection = {
  id: true,
  studentId: true,
  type: true,
  fileId: true,
  createdAt: true,
} as const;

type DocumentRow = { id: string; studentId: string; type: StudentDocumentType; fileId: string; createdAt: Date };

function toDocumentRecord(row: DocumentRow): StudentDocumentRecord {
  return { id: row.id, studentId: row.studentId, type: row.type, fileId: row.fileId, createdAt: row.createdAt };
}

export async function countPendingReviewStudents(filters: PendingReviewFilters): Promise<number> {
  return getPrisma().student.count({
    where: { coach: { province: filters.province }, profileStatus: filters.status ?? { in: ["PENDING", "REJECTED"] } },
  });
}

export async function findPendingReviewStudents(
  filters: PendingReviewFilters,
  skip: number,
  take: number,
): Promise<PendingReviewStudent[]> {
  const rows = await getPrisma().student.findMany({
    where: { coach: { province: filters.province }, profileStatus: filters.status ?? { in: ["PENDING", "REJECTED"] } },
    select: {
      ...studentSelection,
      coach: { select: { fullName: true } },
      documents: { select: documentSelection, orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
    skip,
    take,
  });

  return rows.map((row) => ({
    ...toStudentRecord(row),
    coachName: row.coach.fullName,
    documents: row.documents.map(toDocumentRecord),
    photoFileId: row.documents.find((document) => document.type === "PHOTO")?.fileId ?? null,
  }));
}

export async function updateProfileStatusFromPendingOrRejected(id: string, input: ProfileReviewInput): Promise<StudentRecord | null> {
  return getPrisma().$transaction(async (tx) => {
    const data =
      input.status === "APPROVED"
        ? { profileStatus: "APPROVED" as const, profileNote: null, approvedById: input.reviewedById, approvedAt: new Date() }
        : { profileStatus: "REJECTED" as const, profileNote: input.note, approvedById: input.reviewedById, approvedAt: null };

    const applied = await tx.student.updateMany({ where: { id, profileStatus: { in: ["PENDING", "REJECTED"] } }, data });
    if (applied.count === 0) return null;

    return tx.student.findUnique({ where: { id }, select: studentSelection }).then((row) => (row ? toStudentRecord(row) : null));
  });
}

export async function findStudentDocument(studentId: string, type: StudentDocumentType): Promise<StudentDocumentRecord | null> {
  const row = await getPrisma().studentDocument.findUnique({
    where: { studentId_type: { studentId, type } },
    select: documentSelection,
  });

  return row ? toDocumentRecord(row) : null;
}

export async function countStudentPhotoChangeRequests(studentId: string): Promise<number> {
  return getPrisma().studentPhotoChangeRequest.count({ where: { studentId } });
}

export async function countStudentProvinceChangeRequests(studentId: string): Promise<number> {
  return getPrisma().studentProvinceChangeRequest.count({ where: { studentId } });
}
