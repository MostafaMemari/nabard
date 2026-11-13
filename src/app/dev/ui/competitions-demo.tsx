"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn, DeadlineChip, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Competition, useCompetitions } from "@/features/competitions";
import { formatRialsAsToman } from "@/lib/format";

type DemoState = "data" | "loading" | "empty" | "error";

const stateLabels: Record<DemoState, string> = {
  data: "داده",
  loading: "بارگذاری",
  empty: "خالی",
  error: "خطا",
};

const disciplineLabels: Record<Competition["discipline"], string> = {
  KYORUGI: "کیوروگی",
  POOMSAE: "پومسه",
};

const ageCategoryLabels: Record<string, string> = {
  blossom: "شکوفه",
  youth: "نونهال",
  cadet: "نوجوان",
  junior: "جوان",
  young: "امید",
  senior: "بزرگسال",
  ultra: "پیشکسوت",
};

const columns: DataTableColumn<Competition>[] = [
  {
    id: "title",
    header: "عنوان",
    cell: (row) => (
      <div className="flex flex-col leading-tight">
        <span className="font-medium">{row.title}</span>
        <span className="text-subtle text-muted-foreground">{disciplineLabels[row.discipline]}</span>
      </div>
    ),
    sortValue: (row) => row.title,
  },
  { id: "age", header: "رده سنی", cell: (row) => ageCategoryLabels[row.ageCategoryId] ?? row.ageCategoryId },
  {
    id: "deadline",
    header: "مهلت ثبت نام",
    cell: (row) => <DeadlineChip deadline={row.registrationDeadline} />,
    sortValue: (row) => row.registrationDeadline,
  },
  {
    id: "fee",
    header: "هزینه",
    cell: (row) => formatRialsAsToman(Number(row.feePerStudent)),
    align: "end",
    sortValue: (row) => Number(row.feePerStudent),
  },
  { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.status} /> },
];

export function CompetitionsDemo() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<DemoState>("data");
  const { competitions, isLoading, error, mutate } = useCompetitions();

  const query = search.trim();
  const filtered = competitions.filter((competition) => competition.title.includes(query));
  const rows = state === "empty" ? [] : filtered;
  const errorState = state === "error" ? new Error("demo") : state === "data" ? error : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(stateLabels) as DemoState[]).map((item) => (
          <Button key={item} type="button" size="sm" variant={state === item ? "secondary" : "outline"} onClick={() => setState(item)}>
            {stateLabels[item]}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={state === "loading" || (state === "data" && isLoading)}
        error={errorState}
        onRetry={() => mutate()}
        pageSize={3}
        toolbar={
          <>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی مسابقه" className="sm:max-w-xs" />
            {query ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setSearch("")}>
                پاک کردن جستجو
              </Button>
            ) : null}
          </>
        }
        emptyTitle={query ? `نتیجه ای برای «${query}» پیدا نشد` : "هنوز مسابقه ای ثبت نشده است"}
        emptyAction={
          <Button type="button" size="sm">
            مسابقه جدید
          </Button>
        }
      />
    </div>
  );
}
