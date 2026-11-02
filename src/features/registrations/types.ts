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
