"use client";

import { MapIcon } from "lucide-react";
import { DataTable, PageHeader } from "@/components/shared";
import { toPersianDigits } from "@/lib/format";
import { provinceLabels } from "@/lib/provinces";
import { useSuperSummary } from "../hooks/use-super-summary";
import type { ProvinceSummary } from "../types";

const columns = [
  {
    id: "province",
    header: "استان",
    cell: (row: ProvinceSummary) => provinceLabels[row.province],
    sortValue: (row: ProvinceSummary) => provinceLabels[row.province],
    align: "center" as const,
  },
  { id: "admins", header: "ادمین ها", cell: (row: ProvinceSummary) => toPersianDigits(row.admins), align: "center" as const },
  { id: "coaches", header: "مربیان", cell: (row: ProvinceSummary) => toPersianDigits(row.coaches), align: "center" as const },
  {
    id: "students",
    header: "هنرجویان",
    cell: (row: ProvinceSummary) => toPersianDigits(row.students),
    align: "center" as const,
    minScreen: "lg" as const,
  },
  { id: "competitions", header: "مسابقات", cell: (row: ProvinceSummary) => toPersianDigits(row.competitions), align: "center" as const },
  {
    id: "registrations",
    header: "ثبت نام ها",
    cell: (row: ProvinceSummary) => toPersianDigits(row.registrations),
    align: "center" as const,
    minScreen: "lg" as const,
  },
  {
    id: "pendingPayments",
    header: "پرداخت های در انتظار",
    cell: (row: ProvinceSummary) => toPersianDigits(row.pendingPayments),
    align: "center" as const,
    minScreen: "lg" as const,
  },
];

function SummaryCardRow({ row }: { row: ProvinceSummary }) {
  const items: Array<[string, number]> = [
    ["ادمین ها", row.admins],
    ["مربیان", row.coaches],
    ["هنرجویان", row.students],
    ["مسابقات", row.competitions],
    ["ثبت نام ها", row.registrations],
    ["پرداخت های در انتظار", row.pendingPayments],
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="mb-2 text-center text-sm font-medium">{provinceLabels[row.province]}</p>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-center">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <dt className="text-subtle text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium tabular-nums">{toPersianDigits(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function SuperHomeScreen() {
  const { summary, isLoading, error, mutate } = useSuperSummary();

  return (
    <>
      <PageHeader title="خانه" description="خلاصه آمار همه استان ها." />
      <DataTable
        columns={columns}
        rows={summary ?? []}
        getRowId={(row) => row.province}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        pageSize={31}
        skeletonRows={8}
        renderCard={(row) => <SummaryCardRow row={row} />}
        emptyIcon={MapIcon}
        emptyTitle="آماری برای نمایش وجود ندارد."
      />
    </>
  );
}
