"use client";

import { CountdownChip, SectionCard } from "@/components/shared";
import type { Belt } from "@/features/base-data";
import { BeltChips, type Competition, CompetitionMetaChips, disciplineIcons } from "@/features/competitions";

export function CompetitionSummaryCard({
  competition,
  feeLabel,
  belts,
}: {
  competition: Pick<Competition, "title" | "discipline" | "ageCategoryLabel" | "gender" | "beltIds" | "registrationDeadline">;
  feeLabel: string;
  belts: Belt[];
}) {
  return (
    <SectionCard
      title={competition.title}
      icon={disciplineIcons[competition.discipline]}
      action={<CountdownChip deadline={competition.registrationDeadline} />}
    >
      <CompetitionMetaChips competition={competition} />
      {competition.beltIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <BeltChips belts={belts} ids={competition.beltIds} />
        </div>
      ) : null}
      <p className="text-subtle text-muted-foreground">هزینه هر هنرجو: {feeLabel}</p>
    </SectionCard>
  );
}
