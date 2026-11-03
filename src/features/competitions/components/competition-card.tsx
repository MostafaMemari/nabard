"use client";

import { CountdownChip, IconTile, MobileCardChips, MobileCardLink, MobileCardTop, StatusBadge } from "@/components/shared";
import type { Belt } from "@/features/base-data";
import { formatNumber } from "@/lib/format";
import { disciplineIcons } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";
import { CompetitionMetaChips } from "./competition-meta-chips";
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
        end={<StatusBadge status={competition.status} />}
      />
      <CompetitionMetaChips competition={competition} />
      <MobileCardChips>
        <BeltChips belts={belts} ids={competition.beltIds} />
        {competition.level === "COUNTY" ? competition.countyNames.map((name) => <CountyChip key={name} name={name} />) : null}
      </MobileCardChips>
      <MobileCardChips>
        <CountdownChip deadline={competition.registrationDeadline} />
        <span className="text-subtle text-muted-foreground tabular-nums">{formatNumber(registrationCount)} ثبت نام</span>
      </MobileCardChips>
    </MobileCardLink>
  );
}
