"use client";

import { useMemo } from "react";
import { Table } from "@/components/ui/table";
import { DataTableBody } from "./data-table-body";
import { DataTableCards } from "./data-table-cards";
import { DataTableHeader } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";
import { useTableSort } from "./data-table-sort";
import type { DataTableProps } from "./data-table-types";
import { ErrorBanner } from "./error-banner";

export type { DataTableColumn, DataTableProps } from "./data-table-types";

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  error,
  onRetry,
  toolbar,
  emptyTitle = "موردی برای نمایش وجود ندارد",
  emptyAction,
  emptyIcon,
  pageSize = 10,
  skeletonRows = 5,
  onRowClick,
  renderCard,
}: DataTableProps<T>) {
  const { sort, sortedRows, page, setPage, toggleSort } = useTableSort(rows, columns);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const skeletonKeys = useMemo(() => Array.from({ length: skeletonRows }, (_, index) => `skeleton-${index}`), [skeletonRows]);

  const tableCard = (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
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
          emptyIcon={emptyIcon}
          onRowClick={onRowClick}
        />
      </Table>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {toolbar ? <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{toolbar}</div> : null}

      {error ? (
        <ErrorBanner onRetry={onRetry} />
      ) : (
        <>
          {renderCard ? (
            <>
              <div className="hidden md:block">{tableCard}</div>
              <div className="md:hidden">
                <DataTableCards
                  rows={pageRows}
                  getRowId={getRowId}
                  isLoading={isLoading}
                  skeletonCount={Math.min(skeletonRows, 4)}
                  emptyTitle={emptyTitle}
                  emptyAction={emptyAction}
                  emptyIcon={emptyIcon}
                  renderCard={renderCard}
                />
              </div>
            </>
          ) : (
            tableCard
          )}
          {!isLoading && pageRows.length > 0 ? (
            <DataTablePagination page={currentPage} pageCount={pageCount} total={sortedRows.length} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}
