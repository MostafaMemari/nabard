import type { FilterTab } from "@/components/shared";
import type { PhotoChangeStatus } from "./types";

export const photoChangeTabs: (FilterTab & { status?: PhotoChangeStatus })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار بررسی", status: "PENDING" },
  { id: "approved", label: "تأیید شده", status: "APPROVED" },
  { id: "rejected", label: "رد شده", status: "REJECTED" },
];
