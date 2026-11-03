"use client";

import { useBelts } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { useSearchParam, useSearchParamText } from "@/lib/use-search-param";
import { useCompetitions } from "../hooks/use-competitions";
import { competitionsColumns } from "./competitions-columns";

const statusTabs: { id: string; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "DRAFT", label: "پیش نویس" },
  { id: "PUBLISHED", label: "منتشر شده" },
  { id: "CANCELED", label: "لغو شده" },
];

export function useCompetitionsView() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const search = useSearchParamText("q");
  const { competitions, isLoading, error, mutate } = useCompetitions();
  const { registrations } = useRegistrations();
  const { belts } = useBelts();

  const counts = {
    all: competitions.length,
    DRAFT: competitions.filter((item) => item.status === "DRAFT").length,
    PUBLISHED: competitions.filter((item) => item.status === "PUBLISHED").length,
    CANCELED: competitions.filter((item) => item.status === "CANCELED").length,
  };

  const rows = competitions.filter(
    (competition) => (statusFilter === "" || competition.status === statusFilter) && competition.title.includes(search.value.trim()),
  );

  const columns = competitionsColumns({ belts, registrationCount: (id) => registrations.filter((r) => r.competitionId === id).length });

  return {
    tabs: statusTabs,
    counts,
    statusValue: statusFilter === "" ? "all" : statusFilter,
    onStatusChange: (id: string) => setStatusFilter(id === "all" ? null : id),
    search,
    rows,
    columns,
    belts,
    registrationCount: (id: string) => registrations.filter((registration) => registration.competitionId === id).length,
    isLoading,
    error,
    retry: mutate,
  };
}
