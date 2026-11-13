"use client";

import { UsersIcon } from "lucide-react";
import { Avatar, DataTable, PageHeader, StatusBadge } from "@/components/shared";
import type { User } from "@/features/users";
import { GenderChip, useCoaches } from "@/features/users";
import { toPersianDigits } from "@/lib/format";
import { useSearchParam } from "@/lib/use-search-param";
import { ProvinceFilter } from "./province-filter";

const columns = [
  {
    id: "name",
    header: "مربی",
    cell: (row: User) => (
      <div className="flex items-center gap-2.5">
        <Avatar id={row.id} name={row.fullName} size="sm" />
        <span className="font-medium">{row.fullName}</span>
      </div>
    ),
    sortValue: (row: User) => row.fullName,
  },
  { id: "mobile", header: "شماره همراه", cell: (row: User) => toPersianDigits(row.mobile) },
  { id: "gender", header: "جنسیت", cell: (row: User) => <GenderChip gender={row.gender} /> },
  { id: "county", header: "شهرستان", cell: (row: User) => row.countyName ?? "نامشخص", minScreen: "lg" as const },
  { id: "status", header: "وضعیت", cell: (row: User) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} /> },
];

function CoachCard({ coach }: { coach: User }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar id={coach.id} name={coach.fullName} size="md" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{coach.fullName}</p>
        <StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-subtle text-muted-foreground">شماره همراه</span>
        <span className="text-sm tabular-nums">{toPersianDigits(coach.mobile)}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="text-subtle text-muted-foreground">جنسیت</span>
        <GenderChip gender={coach.gender} />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="text-subtle text-muted-foreground">شهرستان</span>
        <span className="text-sm">{coach.countyName ?? "نامشخص"}</span>
      </div>
    </div>
  );
}

export function SuperCoachesScreen() {
  const [province] = useSearchParam("province");
  const { coaches, isLoading, error, mutate } = useCoaches({ province: province === "" ? undefined : province });

  return (
    <>
      <PageHeader title="مربیان" description="فهرست مربیان همه استان ها؛ فقط قابل مشاهده است" />
      <DataTable
        columns={columns}
        rows={coaches}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => <CoachCard coach={row} />}
        emptyIcon={UsersIcon}
        emptyTitle="مربی ای یافت نشد"
        toolbar={
          <div className="flex items-center justify-end gap-3">
            <ProvinceFilter />
          </div>
        }
      />
    </>
  );
}
