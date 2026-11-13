"use client";

import { UsersIcon } from "lucide-react";
import { DataTable, EmptyState, ErrorBanner, StateCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import type { Belt } from "@/features/base-data";
import type { Student } from "../types";
import { StudentCardList } from "./students-card-list";
import { studentColumns } from "./students-columns";

export function StudentsResults({
  rows,
  belts,
  isLoading,
  error,
  onRetry,
  query,
  onOpen,
  onDelete,
}: {
  rows: Student[];
  belts: Belt[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  query: string;
  onOpen: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  if (error) {
    return <ErrorBanner onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <StateCard className="flex flex-col gap-3 p-4">
        {["s1", "s2", "s3", "s4", "s5"].map((key) => (
          <Skeleton key={key} className="h-13 w-full" />
        ))}
      </StateCard>
    );
  }

  if (rows.length === 0) {
    return (
      <StateCard>
        <EmptyState icon={UsersIcon} title={query !== "" ? `نتیجه ای برای «${query}» پیدا نشد.` : "هنوز هنرجویی اضافه نکرده اید."} />
      </StateCard>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={studentColumns({ belts, onDelete })} rows={rows} getRowId={(row) => row.id} onRowClick={onOpen} />
      </div>
      <div className="md:hidden">
        <StudentCardList rows={rows} onEdit={onOpen} onDelete={onDelete} />
      </div>
    </>
  );
}
