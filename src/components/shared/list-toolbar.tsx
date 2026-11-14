"use client";

import type { useSearchParamText } from "@/lib/use-search-param";
import type { FilterTab } from "./filter-tabs";
import { FilterTabs } from "./filter-tabs";
import { SearchInput } from "./search-input";

// Inline list filters for every list page: tabs are always visible — three
// per row on mobile, a horizontal strip on desktop. There is no filter
// sheet anymore.
export function ListToolbar({
  tabs,
  counts,
  statusValue,
  onStatusChange,
  search,
  searchLabel,
}: {
  tabs: FilterTab[];
  counts: Record<string, number>;
  statusValue: string;
  onStatusChange: (id: string) => void;
  search?: ReturnType<typeof useSearchParamText>;
  searchLabel?: string;
}) {
  const searchField =
    search && searchLabel ? (
      <SearchInput value={search.input} onChange={search.setInput} placeholder={searchLabel} label={searchLabel} />
    ) : null;

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <FilterTabs items={tabs} counts={counts} value={statusValue} onChange={onStatusChange} variant="grid" />
      {searchField}
    </div>
  );
}
