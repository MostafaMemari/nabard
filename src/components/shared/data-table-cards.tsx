"use client";

import type { LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";

export function DataTableCards<T>({
  rows,
  getRowId,
  isLoading,
  skeletonCount,
  emptyTitle,
  emptyAction,
  emptyIcon,
  renderCard,
}: {
  rows: T[];
  getRowId: (row: T) => string;
  isLoading: boolean;
  skeletonCount: number;
  emptyTitle: string;
  emptyAction?: ReactNode;
  emptyIcon?: LucideIcon;
  renderCard: (row: T) => ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: skeletonCount }, (_, index) => `card-${index}`).map((key) => (
          <div key={key} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState title={emptyTitle} action={emptyAction} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <Fragment key={getRowId(row)}>{renderCard(row)}</Fragment>
      ))}
    </div>
  );
}
