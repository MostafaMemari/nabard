import type { StatusKey } from "@/components/shared";

export type DecideStatus = "PENDING" | "APPROVED" | "CONFIRMED" | "REJECTED";

export function paymentBadgeStatus(status: DecideStatus): StatusKey {
  return status === "PENDING" ? "PENDING_REVIEW" : status === "APPROVED" || status === "CONFIRMED" ? "APPROVED" : "REJECTED";
}
