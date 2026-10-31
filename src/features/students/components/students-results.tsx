"use client";

import { PlusIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { DataTable, EmptyState, ErrorBanner } from "@/components/shared";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        {["s1", "s2", "s3", "s4", "s5"].map((key) => (
          <Skeleton key={key} className="h-13 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState
          icon={UsersIcon}
          title={query !== "" ? `نتیجه‌ای برای «${query}» پیدا نشد.` : "هنوز هنرجویی اضافه نکرده‌اید."}
          action={
            query === "" ? (
              <Button size="sm" render={<Link href="/coach/students/new" />}>
                <PlusIcon data-icon="inline-start" />
                هنرجوی جدید
              </Button>
            ) : undefined
          }
        />
      </div>
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
