export type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export type Payment = {
  id: string;
  competitionId: string;
  coachId: string;
  amount: string;
  receiptKey: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
