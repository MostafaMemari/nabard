import type { FilterTab } from "@/components/shared";

export const profileReviewTabs: (FilterTab & { status?: "PENDING" | "REJECTED" })[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار تایید", status: "PENDING" },
  { id: "rejected", label: "رد شده", status: "REJECTED" },
];
