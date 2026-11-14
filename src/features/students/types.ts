import type { Gender } from "@/features/base-data";

export type ProfileStatus = "PENDING" | "APPROVED" | "REJECTED";

export type StudentDocumentType = "PHOTO" | "NATIONAL_ID_OR_BIRTH_CERTIFICATE" | "INSURANCE" | "BELT_CERTIFICATE";

export type StudentDocument = {
  id: string;
  studentId: string;
  type: StudentDocumentType;
  fileId: string;
  createdAt: string;
  // Direct R2 url of the document image, ready for <img src>;
  // null when the file is not on R2 (local development without R2 env vars).
  url?: string | null;
};

export type Student = {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: string;
  mobile: string | null;
  insuranceDate: string | null;
  tkdBankChargeYear: number | null;
  beltCertificateDate: string | null;
  beltId: string;
  coachId: string;
  profileStatus: ProfileStatus;
  profileNote: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Public R2 URL for the profile photo, ready to drop into <img src>;
  // null/absent when the student has no photo.
  photoUrl?: string | null;
};

export type StudentDetail = Student & { coachName: string; documents: StudentDocument[] };

export type PendingReviewStudent = Student & { coachName: string; documents: StudentDocument[] };

export type StudentInput = {
  fullName: string;
  nationalCode: string;
  birthDate: string;
  mobile: string;
  beltId: string;
  beltCertificateDate?: string;
  insuranceDate?: string;
  tkdBankChargeYear?: string;
};

export type StudentImportRowError = { row: number; message: string };

export type StudentImportResult = { imported: number; errors: StudentImportRowError[] };

export const requiredDocumentTypes: StudentDocumentType[] = ["PHOTO"];

export function profileStatusKey(status: ProfileStatus): "PROFILE_PENDING" | "PROFILE_APPROVED" | "PROFILE_REJECTED" {
  return status === "PENDING" ? "PROFILE_PENDING" : status === "APPROVED" ? "PROFILE_APPROVED" : "PROFILE_REJECTED";
}
