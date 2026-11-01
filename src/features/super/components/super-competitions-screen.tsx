"use client";

import { TrophyIcon } from "lucide-react";
import { DataTable, DeadlineChip, FilterTabs, IconTile, PageHeader, StatusBadge } from "@/components/shared";
import { type Competition, CountyChip, disciplineIcons, disciplineLabels, useCompetitions } from "@/features/competitions";
import { useSearchParam } from "@/lib/use-search-param";
import { ProvinceFilter } from "./province-filter";

const statusTabs = [
  { id: "all", label: "همه" },
  { id: "DRAFT", label: "پیش نویس" },
  { id: "PUBLISHED", label: "منتشر شده" },
  { id: "CANCELED", label: "لغو شده" },
];

const columns = [
  {
    id: "title",
    header: "عنوان",
    cell: (row: Competition) => (
      <div className="flex items-center gap-2.5">
        <IconTile icon={disciplineIcons[row.discipline]} size="sm" />
        <div className="flex min-w-36 flex-col gap-1 leading-tight">
          <span className="font-medium">{row.title}</span>
          <span className="text-subtle text-muted-foreground">{disciplineLabels[row.discipline]}</span>
          {row.level === "COUNTY" && row.hostCountyName ? (
            <span className="w-fit">
              <CountyChip name={row.hostCountyName} />
            </span>
          ) : null}
        </div>
      </div>
    ),
    sortValue: (row: Competition) => row.title,
  },
  { id: "deadline", header: "مهلت ثبت نام", cell: (row: Competition) => <DeadlineChip deadline={row.registrationDeadline} /> },
  { id: "status", header: "وضعیت", cell: (row: Competition) => <StatusBadge status={row.status} /> },
];

export function SuperCompetitionsScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const [province] = useSearchParam("province");
  const { competitions, isLoading, error, mutate } = useCompetitions({ province: province === "" ? undefined : province });

  const counts = {
    all: competitions.length,
    DRAFT: competitions.filter((item) => item.status === "DRAFT").length,
    PUBLISHED: competitions.filter((item) => item.status === "PUBLISHED").length,
    CANCELED: competitions.filter((item) => item.status === "CANCELED").length,
  };

  const activeTab = statusFilter === "" ? "all" : statusFilter;
  const rows = activeTab === "all" ? competitions : competitions.filter((item) => item.status === activeTab);

  return (
    <>
      <PageHeader title="مسابقات" description="فهرست مسابقات همه استان ها؛ فقط قابل مشاهده است." />
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        emptyIcon={TrophyIcon}
        emptyTitle="مسابقه ای یافت نشد."
        toolbar={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <FilterTabs items={statusTabs} counts={counts} value={activeTab} onChange={(id) => setStatusFilter(id === "all" ? null : id)} />
            <ProvinceFilter />
          </div>
        }
      />
    </>
  );
}
