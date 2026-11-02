"use client";

import { CountdownChip, IconTile, MobileCardChips, MobileCardLine, MobileCardLink, MobileCardTop, StatusBadge } from "@/components/shared";
import { type Belt, genderLabels } from "@/features/base-data";
import { formatNumber } from "@/lib/format";
import { disciplineIcons, disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";
import { CountyChip } from "./county-chip";

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
        leading={<IconTile icon={disciplineIcons[competition.discipline]} size="sm" />}
        title={competition.title}
        subtitle={disciplineLabels[competition.discipline]}
        end={<StatusBadge status={competition.status} />}
      />
      <MobileCardLine label="رده سنی" value={`${competition.ageCategoryLabel} · ${genderLabels[competition.gender]}`} />
      <MobileCardLine label="ثبت نام ها" value={`${formatNumber(registrationCount)} هنرجو`} />
      <MobileCardChips>
        <BeltChips belts={belts} ids={competition.beltIds} />
        {competition.level === "COUNTY" ? competition.countyNames.map((name) => <CountyChip key={name} name={name} />) : null}
      </MobileCardChips>
      <CountdownChip deadline={competition.registrationDeadline} className="self-start" />
    </MobileCardLink>
  );
}
