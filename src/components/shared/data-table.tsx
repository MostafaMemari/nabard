"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { DataTableBody } from "./data-table-body";
import { DataTableHeader } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";
import type { DataTableColumn, SortState } from "./data-table-types";

export type { DataTableColumn } from "./data-table-types";

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyAction?: ReactNode;
  pageSize?: number;
  skeletonRows?: number;
  onRowClick?: (row: T) => void;
};

function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: SortState): T[] {
  const sortValue = sort ? columns.find((column) => column.id === sort.columnId)?.sortValue : undefined;

  if (!sort || !sortValue) {
    return rows;
  }

  const factor = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const first = sortValue(left);
    const second = sortValue(right);

    if (first === second) {
      return 0;
    }

    return (first > second ? 1 : -1) * factor;
  });
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  error,
  onRetry,
  toolbar,
  emptyTitle = "موردی برای نمایش وجود ندارد.",
  emptyAction,
  pageSize = 10,
  skeletonRows = 5,
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => sortRows(rows, columns, sort), [columns, rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const skeletonKeys = Array.from({ length: skeletonRows }, (_, index) => `skeleton-${index}`);

  function toggleSort(columnId: string) {
    setPage(1);
    setSort((current) => {
      if (current?.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }

      return current.direction === "asc" ? { columnId, direction: "desc" } : null;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbar ? <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{toolbar}</div> : null}

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>دریافت اطلاعات ناموفق بود.</span>
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              تلاش دوباره
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <DataTableHeader columns={columns} sort={sort} onToggleSort={toggleSort} />
              <DataTableBody
                columns={columns}
                rows={pageRows}
                getRowId={getRowId}
                isLoading={isLoading}
                skeletonKeys={skeletonKeys}
                emptyTitle={emptyTitle}
                emptyAction={emptyAction}
                onRowClick={onRowClick}
              />
            </Table>
          </div>
          {!isLoading && pageRows.length > 0 ? (
            <DataTablePagination page={currentPage} pageCount={pageCount} total={sortedRows.length} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}
