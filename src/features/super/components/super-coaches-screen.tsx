"use client";

import { UsersIcon } from "lucide-react";
import { Avatar, DataTable, MobileCard, MobileCardLine, MobileCardTop, PageHeader, StatusBadge } from "@/components/shared";
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
    <MobileCard>
      <MobileCardTop
        leading={<Avatar id={coach.id} name={coach.fullName} size="md" />}
        title={coach.fullName}
        end={<StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />}
      />
      <MobileCardLine label="شماره همراه" value={toPersianDigits(coach.mobile)} />
      <MobileCardLine label="جنسیت" value={<GenderChip gender={coach.gender} />} />
      <MobileCardLine label="شهرستان" value={coach.countyName ?? "نامشخص"} />
    </MobileCard>
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
