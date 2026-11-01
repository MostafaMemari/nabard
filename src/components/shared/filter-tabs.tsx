"use client";

import { cn } from "cn";
import { formatNumber } from "@/lib/format";

export type FilterTab = {
  id: string;
  label: string;
};

function tabClass(active: boolean): string {
  return cn(
    "inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors duration-150 md:h-9",
    active ? "bg-primary-subtle font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function FilterTabs({
  items,
  counts,
  value,
  onChange,
}: {
  items: FilterTab[];
  counts?: Record<string, number>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "true" : undefined}
            className={tabClass(active)}
            onClick={() => onChange(item.id)}
          >
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
