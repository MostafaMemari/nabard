import type { FilterTab } from "@/components/shared";
import type { TransferStatus } from "./types";

export const transferTabs: (FilterTab & { status?: TransferStatus })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار بررسی", status: "PENDING" },
  { id: "approved", label: "تأیید شده", status: "APPROVED" },
  { id: "rejected", label: "رد شده", status: "REJECTED" },
];
