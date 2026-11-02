import type { StatusKey } from "@/components/shared";
import type { TransferStatus } from "./types";

export const transferStatusLabels: Record<TransferStatus, string> = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
};

export function transferStatusKey(status: TransferStatus): StatusKey {
  const keys: Record<TransferStatus, StatusKey> = {
    PENDING: "TRANSFER_PENDING",
    APPROVED: "TRANSFER_APPROVED",
    REJECTED: "TRANSFER_REJECTED",
  };

  return keys[status];
}
