"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn, DeadlineChip, PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ageCategoryLabel, genderLabels, useBelts } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { useCompetitions } from "../hooks/use-competitions";
import { disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";

const statusTabs = [
  { id: "all", label: "همه" },
  { id: "DRAFT", label: "پیش‌نویس" },
  { id: "PUBLISHED", label: "منتشر شده" },
  { id: "CANCELED", label: "لغو شده" },
] as const;

export function CompetitionsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "all";
  const search = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

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
    (competition) => (statusFilter === "all" || competition.status === statusFilter) && competition.title.includes(search.trim()),
  );

  function setParams(next: { status?: string; q?: string }) {
    const params = new URLSearchParams();
    const status = next.status ?? statusFilter;
    const q = next.q ?? search;
    if (status !== "all") {
      params.set("status", status);
    }
    if (q.trim() !== "") {
      params.set("q", q.trim());
    }
    const query = params.toString();
    router.replace(query === "" ? "/admin/competitions" : `/admin/competitions?${query}`, { scroll: false });
  }

  const columns: DataTableColumn<Competition>[] = [
    {
      id: "title",
      header: "عنوان",
      cell: (row) => (
        <div className="flex min-w-44 flex-col leading-tight">
          <span className="font-medium">{row.title}</span>
          <span className="text-subtle text-muted-foreground">{disciplineLabels[row.discipline]}</span>
        </div>
      ),
      sortValue: (row) => row.title,
    },
    { id: "age", header: "رده سنی", cell: (row) => ageCategoryLabel(row.ageCategoryId) },
    { id: "gender", header: "جنسیت", cell: (row) => genderLabels[row.gender] },
    {
      id: "belts",
      header: "کمربندها",
      cell: (row) => <BeltChips belts={belts} ids={row.beltIds} />,
    },
    {
      id: "deadline",
      header: "مهلت ثبت‌نام",
      cell: (row) => <DeadlineChip deadline={row.registrationDeadline} />,
      sortValue: (row) => row.registrationDeadline,
    },
    {
      id: "registrations",
      header: "ثبت‌نام‌ها",
      cell: (row) => registrations.filter((registration) => registration.competitionId === row.id).length,
      align: "end",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="مسابقات"
        description="مدیریت مسابقات و مهلت ثبت‌نام آن‌ها."
        action={
          <Button render={<Link href="/admin/competitions/new" />}>
            <PlusIcon data-icon="inline-start" />
            مسابقه جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        onRowClick={(row) => router.push(`/admin/competitions/${row.id}`)}
        emptyTitle={search.trim() !== "" ? `نتیجه‌ای برای «${search.trim()}» پیدا نشد.` : "هنوز مسابقه‌ای ثبت نشده است."}
        emptyAction={
          <Button render={<Link href="/admin/competitions/new" />} size="sm">
            <PlusIcon data-icon="inline-start" />
            مسابقه جدید
          </Button>
        }
        toolbar={
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {statusTabs.map((tab) => {
                const isActive = tab.id === statusFilter;
                return (
                  <Link
                    key={tab.id}
                    href={tab.id === "all" ? "/admin/competitions" : `/admin/competitions?status=${tab.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={
                      isActive
                        ? "inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary-subtle px-3 text-sm font-medium text-primary"
                        : "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    }
                  >
                    {tab.label}
                    <span className={isActive ? "text-primary/70" : "text-muted-foreground/70"}>{counts[tab.id]}</span>
                  </Link>
                );
              })}
            </div>
            <div className="relative w-full xl:max-w-xs">
              <SearchIcon aria-hidden className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setParams({ q: event.target.value });
                }}
                placeholder="جستجوی مسابقه"
                className="ps-9"
              />
            </div>
          </div>
        }
      />
    </>
  );
}
