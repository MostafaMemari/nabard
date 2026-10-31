"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  search?: ReturnType<typeof useSearchParamText>;
  searchLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = statusValue === "all" ? 0 : 1;

  const searchField =
    search && searchLabel ? (
      <SearchInput value={search.input} onChange={search.setInput} placeholder={searchLabel} label={searchLabel} />
    ) : null;

  return (
    <>
      <div className="hidden w-full flex-col gap-3 md:flex md:flex-row md:items-center md:justify-between">
        <FilterTabs items={tabs} counts={counts} value={statusValue} onChange={onStatusChange} />
        {searchField}
      </div>

      <div className="flex items-center gap-2 md:hidden">
        {searchField}
        <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => setOpen(true)}>
          <SlidersHorizontalIcon data-icon="inline-start" />
          فیلترها
          {activeCount > 0 ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-subtle text-xs font-medium text-primary">
              ۱
            </span>
          ) : null}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="gap-0 rounded-t-2xl">
          <SheetHeader className="border-b border-border">
            <SheetTitle>فیلتر وضعیت</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <FilterTabs items={tabs} counts={counts} value={statusValue} onChange={onStatusChange} />
          </div>
          <SheetFooter className="border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <SheetClose
              render={
                <Button type="button" className="h-11 w-full">
                  نمایش نتایج
                </Button>
              }
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
