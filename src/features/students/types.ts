import type { Gender } from "@/features/base-data";

export type ProfileStatus = "PENDING" | "APPROVED" | "REJECTED";

export type StudentDocumentType = "PHOTO" | "NATIONAL_ID_OR_BIRTH_CERTIFICATE" | "INSURANCE" | "BELT_CERTIFICATE";

export type StudentDocument = {
  id: string;
  studentId: string;
  type: StudentDocumentType;
  fileId: string;
  createdAt: string;
};

export type Student = {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: string;
  weightKg: number | null;
  beltId: string;
  coachId: string;
  profileStatus: ProfileStatus;
  profileNote: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentDetail = Student & { coachName: string; documents: StudentDocument[] };

export type PendingReviewStudent = Student & { coachName: string; documents: StudentDocument[] };

export type StudentInput = Omit<Student, "id" | "createdAt" | "updatedAt" | "coachId" | "profileStatus" | "profileNote" | "approvedAt">;

export const requiredDocumentTypes: StudentDocumentType[] = ["PHOTO", "NATIONAL_ID_OR_BIRTH_CERTIFICATE"];

export function profileStatusKey(status: ProfileStatus): "PROFILE_PENDING" | "PROFILE_APPROVED" | "PROFILE_REJECTED" {
  return status === "PENDING" ? "PROFILE_PENDING" : status === "APPROVED" ? "PROFILE_APPROVED" : "PROFILE_REJECTED";
}
