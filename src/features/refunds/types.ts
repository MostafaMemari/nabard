export type RefundReason = "REGISTRATION_REJECTED" | "COMPETITION_CANCELED";

export type RefundStatus = "PENDING" | "COMPLETED";

export type Refund = {
  id: string;
  registrationId: string;
  coachId: string;
  coachName: string;
  studentName: string;
  competitionId: string;
  competitionTitle: string;
  amount: string;
  reason: RefundReason;
  status: RefundStatus;
  note: string | null;
  processedAt: string | null;
  createdAt: string;
};
