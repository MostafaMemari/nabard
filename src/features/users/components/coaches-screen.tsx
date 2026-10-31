"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudents } from "@/features/students";
import { useCoaches } from "../hooks/use-coaches";
import type { User } from "../types";
import { CoachFormSheet } from "./coach-form-sheet";
import { CoachStatusDialog } from "./coach-status-dialog";
import { coachColumns } from "./coaches-columns";

const statusTabs = [
  { id: "all", label: "همه" },
  { id: "active", label: "فعال" },
  { id: "inactive", label: "غیرفعال" },
] as const;

export function CoachesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "all";
  const search = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const { coaches, isLoading, error, mutate } = useCoaches();
  const { students } = useStudents();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ coach: User; isActive: boolean } | null>(null);

  const counts = {
    all: coaches.length,
    active: coaches.filter((coach) => coach.isActive).length,
    inactive: coaches.filter((coach) => !coach.isActive).length,
  };

  const rows = coaches.filter(
    (coach) =>
      (statusFilter === "all" || (statusFilter === "active" ? coach.isActive : !coach.isActive)) &&
      (search.trim() === "" || coach.fullName.includes(search.trim()) || coach.mobile.includes(search.trim())),
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
    router.replace(query === "" ? "/admin/coaches" : `/admin/coaches?${query}`, { scroll: false });
  }

  const columns = coachColumns({ students, onToggleStatus: (coach) => setPendingStatus({ coach, isActive: !coach.isActive }) });

  return (
    <>
      <PageHeader
        title="مربیان"
        description="فهرست مربیان و هنرجویان هر مربی."
        action={
          <Button onClick={() => setSheetOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            مربی جدید
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
        onRowClick={(row) => router.push(`/admin/coaches/${row.id}`)}
        emptyTitle={search.trim() !== "" ? `نتیجه‌ای برای «${search.trim()}» پیدا نشد.` : "هنوز مربی‌ای اضافه نشده است."}
        emptyAction={
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            مربی جدید
          </Button>
        }
        toolbar={
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {statusTabs.map((tab) => {
                const isActive = tab.id === statusFilter;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setParams({ status: tab.id })}
                    className={
                      isActive
                        ? "inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary-subtle px-3 text-sm font-medium text-primary"
                        : "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    }
                  >
                    {tab.label}
                    <span className={isActive ? "text-primary/70" : "text-muted-foreground/70"}>{counts[tab.id]}</span>
                  </button>
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
                placeholder="جستجوی مربی"
                className="ps-9"
              />
            </div>
          </div>
        }
      />

      <CoachFormSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void mutate()} />

      <CoachStatusDialog
        coach={pendingStatus?.coach ?? null}
        targetActive={pendingStatus?.isActive ?? null}
        onDone={mutate}
        onClose={() => setPendingStatus(null)}
      />
    </>
  );
}
