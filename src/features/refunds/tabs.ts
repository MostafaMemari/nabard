import type { FilterTab } from "@/components/shared";

export const refundsTabs: (FilterTab & { status?: "PENDING" | "COMPLETED" })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار", status: "PENDING" },
  { id: "completed", label: "انجام شده", status: "COMPLETED" },
];
