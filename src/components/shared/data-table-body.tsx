"use client";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { columnScreenClass, type DataTableColumn } from "./data-table-types";
import { EmptyState } from "./empty-state";

export function DataTableBody<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  skeletonKeys,
  emptyTitle,
  emptyAction,
  emptyIcon,
  onRowClick,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading: boolean;
  skeletonKeys: string[];
  emptyTitle: string;
  emptyAction?: ReactNode;
  emptyIcon?: LucideIcon;
  onRowClick?: (row: T) => void;
}) {
  return (
    <TableBody>
      {isLoading
        ? skeletonKeys.map((key) => (
            <TableRow key={key} className="h-13 hover:bg-transparent">
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    columnScreenClass(column),
                    column.align === "end" && "text-end",
                    column.align === "center" && "text-center",
                  )}
                >
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))
        : null}

      {!isLoading && rows.length === 0 ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="p-0">
            <EmptyState title={emptyTitle} action={emptyAction} icon={emptyIcon} />
          </TableCell>
        </TableRow>
      ) : null}

      {!isLoading
        ? rows.map((row) => (
            <TableRow
              key={getRowId(row)}
              className={cn("h-13", onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    "text-sm",
                    columnScreenClass(column),
                    column.align === "end" && "text-end tabular-nums",
                    column.align === "center" && "text-center tabular-nums",
                  )}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        : null}
    </TableBody>
  );
}
