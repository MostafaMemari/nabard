import type { StatusKey } from "@/components/shared";
import type { CountyChangeStatus } from "./types";

export const countyChangeStatusLabels: Record<CountyChangeStatus, string> = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تایید شده",
  REJECTED: "رد شده",
};

export function countyChangeStatusKey(status: CountyChangeStatus): StatusKey {
  const keys: Record<CountyChangeStatus, StatusKey> = {
    PENDING: "COUNTY_CHANGE_PENDING",
    APPROVED: "COUNTY_CHANGE_APPROVED",
    REJECTED: "COUNTY_CHANGE_REJECTED",
  };

  return keys[status];
}
