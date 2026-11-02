"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

export type FilterTab = {
  id: string;
  label: string;
  dot?: ReactNode;
};

function tabClass(active: boolean, scroll: boolean): string {
  return cn(
    "inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors duration-150 md:h-9",
    scroll && "shrink-0",
    active ? "bg-primary-subtle font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function FilterTabs({
  items,
  counts,
  value,
  onChange,
  scroll = false,
}: {
  items: FilterTab[];
  counts?: Record<string, number>;
  value: string;
  onChange: (id: string) => void;
  scroll?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", scroll && "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "true" : undefined}
            className={tabClass(active, scroll)}
            onClick={() => onChange(item.id)}
          >
            {item.dot}
            {item.label}
            {counts ? (
              <span className={cn("tabular-nums", active ? "text-primary" : "text-muted-foreground")}>
                {formatNumber(counts[item.id] ?? 0)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
