import type { StatusKey } from "@/components/shared";
import type { PaymentStatus } from "@/features/payments";
import type { RefundStatus } from "@/features/refunds";
import type { Registration, RegistrationStatus } from "../types";

export type CoachRegistrationRow = {
  registration: Registration;
  studentName: string | null;
  competitionTitle: string;
  competitionDeadline: string | null;
  paymentStatus: PaymentStatus | null;
  paymentAmount: string | null;
  weightClassLabel: string | null;
  refundStatus: RefundStatus | null;
};

export function registrationStatusKey(status: RegistrationStatus): StatusKey {
  if (status === "APPROVED") {
    return "APPROVED";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  return "PENDING_REVIEW";
}

export function paymentStatusKey(status: PaymentStatus): StatusKey {
  if (status === "CONFIRMED") {
    return "APPROVED";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  return "PENDING_REVIEW";
}
