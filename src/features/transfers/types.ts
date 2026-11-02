export type TransferStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TransferRequest = {
  id: string;
  studentId: string;
  studentName: string;
  fromCoachId: string;
  fromCoachName: string;
  toCoachId: string;
  toCoachName: string;
  status: TransferStatus;
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type TransferLookupResult = {
  maskedName: string;
  currentCoachName: string;
};

export type CoachTransferTarget = {
  id: string;
  fullName: string;
  isActive: boolean;
};

// A coach sees their own requests. The requester sees the student and the old
// coach; the old coach sees only the status and the new coach's name.
export type CoachTransferRequest = {
  id: string;
  direction: "incoming" | "outgoing";
  status: TransferStatus;
  toCoachId: string;
  toCoachName: string;
  fromCoachName: string | null;
  studentName: string | null;
  note: string | null;
  createdAt: string | null;
  decidedAt: string | null;
};
