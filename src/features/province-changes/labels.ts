import type { StatusKey } from "@/components/shared";
import type { ProvinceChangeStatus } from "./server/repository";

export const provinceChangeStatusLabels: Record<ProvinceChangeStatus, string> = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};

export function provinceChangeStatusKey(status: ProvinceChangeStatus): StatusKey {
  const keys: Record<ProvinceChangeStatus, StatusKey> = {
    PENDING: "PROVINCE_CHANGE_PENDING",
    APPROVED: "PROVINCE_CHANGE_APPROVED",
    REJECTED: "PROVINCE_CHANGE_REJECTED",
  };

  return keys[status];
}
