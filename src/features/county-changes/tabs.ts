import type { FilterTab } from "@/components/shared";
import type { CountyChangeStatus } from "./types";

export const countyChangeTabs: (FilterTab & { status?: CountyChangeStatus })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار بررسی", status: "PENDING" },
  { id: "approved", label: "تأیید شده", status: "APPROVED" },
  { id: "rejected", label: "رد شده", status: "REJECTED" },
];
