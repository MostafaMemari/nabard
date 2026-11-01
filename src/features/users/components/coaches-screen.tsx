"use client";

import { PlusIcon, UserRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/features/students";
import { useCoaches } from "../hooks/use-coaches";
import type { User } from "../types";
import { CoachCard } from "./coach-card";
import { CoachFormSheet } from "./coach-form-sheet";
import { CoachStatusDialog } from "./coach-status-dialog";
import { coachColumns } from "./coaches-columns";
import { useCoachFilters } from "./use-coach-filters";

export function CoachesScreen() {
  const router = useRouter();
  const { coaches, isLoading, error, mutate } = useCoaches();
  const { students } = useStudents();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ coach: User; isActive: boolean } | null>(null);
  const filters = useCoachFilters(coaches);

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
        rows={filters.rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        onRowClick={(row) => router.push(`/admin/coaches/${row.id}`)}
        renderCard={(row) => (
          <CoachCard
            coach={row}
            studentCount={students.filter((student) => student.coachId === row.id).length}
            onToggleStatus={(coach) => setPendingStatus({ coach, isActive: !coach.isActive })}
          />
        )}
        emptyIcon={UserRoundIcon}
        emptyTitle={
          filters.search.value.trim() !== "" ? `نتیجه ای برای «${filters.search.value.trim()}» پیدا نشد.` : "هنوز مربی ای اضافه نشده است."
        }
        emptyAction={
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            مربی جدید
          </Button>
        }
        toolbar={
          <ListToolbar
            tabs={filters.statusTabs}
            counts={filters.counts}
            statusValue={filters.statusValue}
            onStatusChange={(id) => filters.setStatusFilter(id === "all" ? null : id)}
            search={filters.search}
            searchLabel="جستجوی مربی"
          />
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
