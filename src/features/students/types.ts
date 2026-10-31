import type { Gender } from "@/features/base-data";

export type Student = {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: string;
  weightKg: number | null;
  beltId: string;
  coachId: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentInput = Omit<Student, "id" | "createdAt" | "updatedAt">;
