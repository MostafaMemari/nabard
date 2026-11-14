"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

export type FilterTab = {
  id: string;
  label: string;
  dot?: ReactNode;
};

function tabClass(active: boolean, grid: boolean, scroll: boolean): string {
  return cn(
    "inline-flex h-11 items-center rounded-lg transition-colors duration-150 md:h-9",
    // Grid cells (mobile list toolbars) stay on one line: compact padding and
    // a slightly smaller face keep even "انتقال هنرجو ۱" inside a third of the row.
    grid
      ? "w-full justify-center gap-1 whitespace-nowrap px-1.5 text-[13px] md:gap-1.5 md:px-3 md:text-sm"
      : cn("gap-1.5 px-3 text-sm", scroll && "shrink-0"),
    active ? "bg-primary-subtle font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function FilterTabs({
  items,
  counts,
  value,
  onChange,
  scroll = false,
  variant = "row",
}: {
  items: FilterTab[];
  counts?: Record<string, number>;
  value: string;
  onChange: (id: string) => void;
  scroll?: boolean;
  // "grid" lays the tabs out three per row on mobile (list toolbars);
  // "row" keeps the classic horizontal strip everywhere.
  variant?: "row" | "grid";
}) {
  const grid = variant === "grid";

  return (
    <div
      className={cn(
        grid
          ? "grid grid-cols-3 gap-2 md:flex md:items-center md:gap-1.5"
          : cn("flex items-center gap-1.5", scroll && "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"),
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "true" : undefined}
            className={tabClass(active, grid, scroll && !grid)}
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
