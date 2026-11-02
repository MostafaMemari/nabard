import type { Gender } from "@/features/base-data";
import type { Province } from "@/features/users";

export type Discipline = "KYORUGI" | "POOMSAE";

export type CompetitionStatus = "DRAFT" | "PUBLISHED" | "CANCELED";

export type CompetitionRegistrationState = "NOT_YET_OPEN" | "OPEN" | "CLOSED";

export type CompetitionLevel = "PROVINCIAL" | "COUNTY";

export type RulesSnapshotAgeCategory = {
  id: string;
  code: string;
  label: string;
  startDate: string;
  endDate: string;
};

export type RulesSnapshotBelt = {
  id: string;
  code: string;
  label: string;
  level: number;
};

export type RulesSnapshotWeightClass = {
  id: string;
  label: string;
  min: number;
  max: number | null;
  excludeMin: boolean;
  excludeMax: boolean;
  order: number;
};

export type CompetitionRulesSnapshot = {
  ageCategory: RulesSnapshotAgeCategory;
  minBelt: RulesSnapshotBelt;
  maxBelt: RulesSnapshotBelt;
  weightClasses: RulesSnapshotWeightClass[];
};

export type Competition = {
  id: string;
  title: string;
  province: Province;
  level: CompetitionLevel;
  countyIds: string[];
  countyNames: string[];
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  ageCategoryLabel: string;
  beltIds: string[];
  feePerStudent: string;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: string;
  eventDate: string;
  status: CompetitionStatus;
  rules: CompetitionRulesSnapshot | null;
  cancelReason?: string | null;
  state?: CompetitionRegistrationState;
  eligibleStudentCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CompetitionInput = Omit<
  Competition,
  "id" | "createdAt" | "updatedAt" | "status" | "countyNames" | "ageCategoryLabel" | "rules"
> & {
  status?: CompetitionStatus;
};

export type DeadlineExtension = {
  id: string;
  previousDeadline: string;
  newDeadline: string;
  reopenForRejected: boolean;
  reason: string;
  createdByName: string;
  createdAt: string;
};

export type ExtendCompetitionInput = {
  newDeadline: string;
  reason: string;
  reopenForRejected?: boolean;
};
