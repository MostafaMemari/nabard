import type { RefundReason, RefundStatus } from "./types";

export const refundReasonLabels: Record<RefundReason, string> = {
  REGISTRATION_REJECTED: "رد ثبت نام",
  COMPETITION_CANCELED: "لغو مسابقه",
};

export function refundStatusKey(status: RefundStatus): "REFUND_PENDING" | "REFUND_COMPLETED" {
  return status === "PENDING" ? "REFUND_PENDING" : "REFUND_COMPLETED";
}
