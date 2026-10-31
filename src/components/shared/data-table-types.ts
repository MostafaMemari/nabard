import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "start" | "end";
  minScreen?: "lg" | "xl";
};

export type SortState = { columnId: string; direction: "asc" | "desc" } | null;

export function columnScreenClass<T>(column: DataTableColumn<T>): string {
  if (column.minScreen === "lg") {
    return "hidden lg:table-cell";
  }
  if (column.minScreen === "xl") {
    return "hidden xl:table-cell";
  }
  return "";
}
