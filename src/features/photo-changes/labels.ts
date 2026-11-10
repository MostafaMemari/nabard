import type { StatusKey } from "@/components/shared";
import type { PhotoChangeStatus } from "./server/repository";

export const photoChangeStatusLabels: Record<PhotoChangeStatus, string> = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};

export function photoChangeStatusKey(status: PhotoChangeStatus): StatusKey {
  const keys: Record<PhotoChangeStatus, StatusKey> = {
    PENDING: "PHOTO_CHANGE_PENDING",
    APPROVED: "PHOTO_CHANGE_APPROVED",
    REJECTED: "PHOTO_CHANGE_REJECTED",
  };

  return keys[status];
}
