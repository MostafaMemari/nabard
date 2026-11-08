"use client";

import { cn } from "cn";
import { formatJalaliDateTime } from "@/lib/format";
import type { EventDayRow } from "../types";

const verdictStyles = {
  MATCH: { label: "همخوان", className: "bg-success-bg text-success" },
  MOVED: { label: "جابجا شد", className: "bg-primary-subtle text-primary" },
  OUT_OF_WEIGHT: { label: "خارج از وزن", className: "bg-danger-bg text-danger" },
} as const;

export function EventDayVerdict({ row, compact = false }: { row: EventDayRow; compact?: boolean }) {
  if (row.weighInVerdict === null || row.weighInAt === null) {
    return <span className="text-subtle text-muted-foreground">توزین نشده</span>;
  }

  const style = verdictStyles[row.weighInVerdict];

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-subtle font-medium", style.className)}>
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {style.label}
      </span>
      {compact ? null : <span className="text-xs text-muted-foreground tabular-nums">{formatJalaliDateTime(new Date(row.weighInAt))}</span>}
    </div>
  );
}
