import type { FilterTab } from "@/components/shared";
import type { ProvinceChangeStatus } from "./types";

export const provinceChangeTabs: (FilterTab & { status?: ProvinceChangeStatus })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار بررسی", status: "PENDING" },
  { id: "approved", label: "تأیید شده", status: "APPROVED" },
  { id: "rejected", label: "رد شده", status: "REJECTED" },
];
