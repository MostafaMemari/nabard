"use client";

import { CountdownChip, IconTile } from "@/components/shared";
import { type Discipline, disciplineIcons } from "@/features/competitions";

export function CompetitionSummaryCard({
  title,
  meta,
  deadline,
  feeLabel,
  discipline,
}: {
  title: string;
  meta: string;
  deadline: string;
  feeLabel: string;
  discipline: Discipline;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <IconTile icon={disciplineIcons[discipline]} />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <CountdownChip deadline={deadline} />
      </div>
      <p className="text-subtle text-muted-foreground">{meta}</p>
      <p className="text-subtle text-muted-foreground">هزینه هر هنرجو: {feeLabel}</p>
    </section>
  );
}
