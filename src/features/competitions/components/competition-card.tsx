"use client";

import { DeadlineChip, MobileCardChips, MobileCardLine, MobileCardLink, MobileCardTop, StatusBadge } from "@/components/shared";
import { ageCategoryLabel, type Belt, genderLabels } from "@/features/base-data";
import { formatNumber } from "@/lib/format";
import { disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";

export function CompetitionCard({
  competition,
  belts,
  registrationCount,
}: {
  competition: Competition;
  belts: Belt[];
  registrationCount: number;
}) {
  return (
    <MobileCardLink href={`/admin/competitions/${competition.id}`}>
      <MobileCardTop
        title={competition.title}
        subtitle={disciplineLabels[competition.discipline]}
        end={<StatusBadge status={competition.status} />}
      />
      <MobileCardLine label="رده سنی" value={`${ageCategoryLabel(competition.ageCategoryId)} · ${genderLabels[competition.gender]}`} />
      <MobileCardLine label="ثبت‌نام‌ها" value={`${formatNumber(registrationCount)} هنرجو`} />
      <MobileCardChips>
        <BeltChips belts={belts} ids={competition.beltIds} />
        <DeadlineChip deadline={competition.registrationDeadline} />
      </MobileCardChips>
    </MobileCardLink>
  );
}
