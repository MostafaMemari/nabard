"use client";

import type { useSearchParamText } from "@/lib/use-search-param";
import { type FilterTab, FilterTabs } from "./filter-tabs";
import { SearchInput } from "./search-input";

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
  search: ReturnType<typeof useSearchParamText>;
  searchLabel: string;
}) {
  return (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <FilterTabs items={tabs} counts={counts} value={statusValue} onChange={onStatusChange} />
      <SearchInput value={search.input} onChange={search.setInput} placeholder={searchLabel} label={searchLabel} />
    </div>
  );
}
