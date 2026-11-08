"use client";

import { cn } from "cn";
import { formatNumber } from "@/lib/format";
import type { EventDaySummary as EventDaySummaryData } from "../types";

export function EventDaySummary({ summary, kyorugi }: { summary: EventDaySummaryData; kyorugi: boolean }) {
  const items = [
    { label: "شرکت کننده", value: summary.approved, className: "" },
    { label: "حاضر", value: summary.checkedIn, className: "" },
    ...(kyorugi
      ? [
          { label: "توزین شده", value: summary.weighed, className: "" },
          { label: "همخوان", value: summary.match, className: "" },
          { label: "جابجا شده", value: summary.moved, className: "" },
          { label: "خارج از وزن", value: summary.outOfWeight, className: summary.outOfWeight > 0 ? "text-danger" : "" },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border px-3 py-2">
          <p className={cn("text-lg font-semibold tabular-nums", item.className)}>{formatNumber(item.value)}</p>
          <p className="text-subtle text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
