"use client";

import { DeadlineChip } from "@/components/shared";

export function CompetitionSummaryCard({
  title,
  meta,
  deadline,
  feeLabel,
}: {
  title: string;
  meta: string;
  deadline: string;
  feeLabel: string;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        <DeadlineChip deadline={deadline} />
      </div>
      <p className="text-subtle text-muted-foreground">{meta}</p>
      <p className="text-subtle text-muted-foreground">هزینه هر هنرجو: {feeLabel}</p>
    </section>
  );
}
