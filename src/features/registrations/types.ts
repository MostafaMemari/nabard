export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Registration = {
  id: string;
  competitionId: string;
  studentId: string;
  coachId: string;
  paymentId: string | null;
  weightClassId: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
