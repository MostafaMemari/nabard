"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { formatNumber } from "@/lib/format";

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors duration-150 md:h-9",
        active
          ? "border-primary/30 bg-primary-subtle font-medium text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function chipCount(active: boolean, count: number): ReactNode {
  return <span className={cn("text-xs tabular-nums", active ? "opacity-70" : "text-muted-foreground")}>{formatNumber(count)}</span>;
}
