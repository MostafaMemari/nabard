"use client";

import { cn } from "cn";

export type FilterTab = {
  id: string;
  label: string;
};

function tabClass(active: boolean): string {
  return cn(
    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors duration-150",
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
            {counts ? <span className={active ? "text-primary/70" : "text-muted-foreground/70"}>{counts[item.id]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
