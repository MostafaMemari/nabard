import type { Gender } from "@/features/base-data";
import type { Province } from "@/features/users";

export type Discipline = "KYORUGI" | "POOMSAE";

export type CompetitionStatus = "DRAFT" | "PUBLISHED" | "CANCELED";

export type Competition = {
  id: string;
  title: string;
  province: Province;
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  beltIds: string[];
  feePerStudent: string;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: string;
  eventDate: string;
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CompetitionInput = Omit<Competition, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: CompetitionStatus;
};
