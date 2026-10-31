import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "start" | "end";
};

export type SortState = { columnId: string; direction: "asc" | "desc" } | null;
