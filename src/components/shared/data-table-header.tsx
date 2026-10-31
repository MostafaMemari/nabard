"use client";

import { cn } from "cn";
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from "lucide-react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DataTableColumn, SortState } from "./data-table-types";

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) {
    return <ChevronsUpDownIcon className="size-4 text-muted-foreground" aria-hidden />;
  }

  return direction === "asc" ? <ChevronUpIcon className="size-4" aria-hidden /> : <ChevronDownIcon className="size-4" aria-hidden />;
}

function getAriaSort<T>(column: DataTableColumn<T>, sort: SortState) {
  if (!column.sortValue) {
    return undefined;
  }

  if (sort?.columnId !== column.id) {
    return "none";
  }

  return sort.direction === "asc" ? "ascending" : "descending";
}

export function DataTableHeader<T>({
  columns,
  sort,
  onToggleSort,
}: {
  columns: DataTableColumn<T>[];
  sort: SortState;
  onToggleSort: (columnId: string) => void;
}) {
  return (
    <TableHeader className="bg-muted/50">
      <TableRow className="hover:bg-transparent">
        {columns.map((column) => (
          <TableHead
            key={column.id}
            aria-sort={getAriaSort(column, sort)}
            className={cn("h-11 text-subtle font-medium text-muted-foreground", column.align === "end" && "text-end")}
          >
            {column.sortValue ? (
              <button
                type="button"
                onClick={() => onToggleSort(column.id)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {column.header}
                <SortIcon active={sort?.columnId === column.id} direction={sort?.direction ?? "asc"} />
              </button>
            ) : (
              column.header
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
