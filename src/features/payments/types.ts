export type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export type Payment = {
  id: string;
  competitionId: string;
  coachId: string;
  amount: string;
  receiptKey: string | null;
  // Direct R2 url of the receipt image, ready for <img src>;
  // null when there is no receipt or the file is not on R2.
  receiptUrl?: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
