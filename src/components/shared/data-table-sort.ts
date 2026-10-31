"use client";

import { useState } from "react";
import type { DataTableColumn, SortState } from "./data-table-types";

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

export function useTableSort<T>(rows: T[], columns: DataTableColumn<T>[]) {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);

  const sortedRows = sortRows(rows, columns, sort);

  function toggleSort(columnId: string) {
    setPage(1);
    setSort((current) => {
      if (current?.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }

      return current.direction === "asc" ? { columnId, direction: "desc" } : null;
    });
  }

  return { sort, sortedRows, page, setPage, toggleSort };
}
