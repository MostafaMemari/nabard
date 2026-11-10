import type { Gender } from "@/features/base-data";
import type { PhotoChangeStatus } from "./server/repository";

export type { PhotoChangeStatus };

export type PhotoChangeRequest = {
  id: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  hasCurrentPhoto: boolean;
  status: PhotoChangeStatus;
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type CoachPhotoChangeRequest = {
  id: string;
  studentId: string;
  studentName: string;
  status: PhotoChangeStatus;
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type StudentGenderRow = {
  gender: Gender;
};
