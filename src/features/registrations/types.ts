import type { PaymentStatus } from "@/features/payments";

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RegistrationStudent = {
  id: string;
  fullName: string;
  beltId: string;
};

export type Registration = {
  id: string;
  competitionId: string;
  competitionTitle: string;
  studentId: string;
  coachId: string;
  paymentId: string | null;
  weightClassId: string | null;
  weightClassLabel: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  student: RegistrationStudent;
};

export type RegistrationBundleStudent = {
  id: string;
  studentName: string;
  status: RegistrationStatus;
  note: string | null;
};

export type RegistrationDetail = {
  registration: Registration;
  competition: { id: string; title: string; registrationDeadline: string } | null;
  weightClassLabel: string | null;
  payment: { id: string; status: PaymentStatus; amount: string; createdAt: string } | null;
  bundle: RegistrationBundleStudent[];
};

export type Participant = {
  registrationId: string;
  studentId: string;
  fullName: string;
  nationalCode: string;
  birthDate: string;
  beltLabel: string;
  weightClassLabel: string | null;
  coachName: string;
};

export type WeighInVerdict = "MATCH" | "MOVED" | "OUT_OF_WEIGHT";

export type EventDayRow = {
  id: string;
  student: { id: string; fullName: string; nationalCode: string };
  coachName: string;
  beltLabel: string;
  weightClassId: string | null;
  weightClassLabel: string | null;
  checkInAt: string | null;
  checkInByName: string | null;
  weighInKg: number | null;
  weighInAt: string | null;
  weighInByName: string | null;
  weighInVerdict: WeighInVerdict | null;
};

export type EventDayRowPatch = {
  id: string;
  weightClassId?: string | null;
  weightClassLabel?: string | null;
  checkInAt?: string | null;
  weighInKg?: number | null;
  weighInAt?: string | null;
  weighInVerdict?: WeighInVerdict | null;
};

export type EventDaySummary = {
  approved: number;
  checkedIn: number;
  weighed: number;
  match: number;
  moved: number;
  outOfWeight: number;
};

export type EventDayCompetition = {
  id: string;
  title: string;
  status: string;
  discipline: string;
  eventDate: string;
  registrationDeadline: string;
};

export type EventDay = {
  competition: EventDayCompetition;
  summary: EventDaySummary;
  rows: EventDayRow[];
};
