import type { FilterTab } from "@/components/shared";

export const paymentsTabs: (FilterTab & { status?: "PENDING" | "CONFIRMED" | "REJECTED" })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار بررسی", status: "PENDING" },
  { id: "confirmed", label: "تأیید شده", status: "CONFIRMED" },
  { id: "rejected", label: "رد شده", status: "REJECTED" },
];
