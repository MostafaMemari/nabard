"use client";

import type { FilterTab } from "@/components/shared";
import { useSearchParam, useSearchParamText } from "@/lib/use-search-param";
import type { User } from "../types";

const statusTabs: FilterTab[] = [
  { id: "all", label: "همه" },
  { id: "active", label: "فعال" },
  { id: "inactive", label: "غیرفعال" },
];

export function useCoachFilters(coaches: User[]) {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const search = useSearchParamText("q");

  const counts = {
    all: coaches.length,
    active: coaches.filter((coach) => coach.isActive).length,
    inactive: coaches.filter((coach) => !coach.isActive).length,
  };

  const query = search.value.trim();
  const rows = coaches.filter((coach) => {
    const statusOk = statusFilter === "" || (statusFilter === "active" ? coach.isActive : !coach.isActive);
    const searchOk = query === "" || coach.fullName.includes(query) || coach.mobile.includes(query);
    return statusOk && searchOk;
  });

  return {
    statusTabs,
    statusValue: statusFilter === "" ? "all" : statusFilter,
    setStatusFilter,
    search,
    counts,
    rows,
  };
}
