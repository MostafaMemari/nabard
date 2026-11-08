"use client";

import { toPersianDigits } from "@/lib/format";

export type BarListItem = {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
};

// Simple horizontal bars that grow from the inline-start (right in RTL).
export function BarList({ items, emptyMessage }: { items: BarListItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between gap-3">
            <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
              <span className="truncate text-sm font-medium">{item.label}</span>
              {item.sublabel ? <span className="text-subtle text-muted-foreground">{item.sublabel}</span> : null}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{toPersianDigits(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
