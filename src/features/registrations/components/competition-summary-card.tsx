"use client";

import { CountdownChip, SectionCard } from "@/components/shared";
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
    <SectionCard title={title} icon={disciplineIcons[discipline]} action={<CountdownChip deadline={deadline} />}>
      <p className="text-subtle text-muted-foreground">{meta}</p>
      <p className="text-subtle text-muted-foreground">هزینه هر هنرجو: {feeLabel}</p>
    </SectionCard>
  );
}
