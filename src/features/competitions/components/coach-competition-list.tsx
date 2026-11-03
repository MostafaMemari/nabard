"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { CountdownChip, DeadlineProgress, IconTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";
import { disciplineIcons } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";
import { CompetitionMetaChips } from "./competition-meta-chips";
import { CountyChip } from "./county-chip";

export function CoachCompetitionList({ competitions }: { competitions: Competition[] }) {
  const { belts } = useBelts();

  return (
    <div className="flex flex-col gap-3">
      {competitions.map((competition) => (
        <article key={competition.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
          <div className="flex flex-col gap-4 @5xl:flex-row @5xl:items-start @5xl:gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={disciplineIcons[competition.discipline]} />
                <Link
                  href={`/coach/competitions/${competition.id}`}
                  className="block min-w-0 truncate text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {competition.title}
                </Link>
              </div>
              <CompetitionMetaChips competition={competition} />
              {competition.beltIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <BeltChips belts={belts} ids={competition.beltIds} />
                </div>
              ) : null}
              {competition.level === "COUNTY" && competition.countyNames.length > 0 ? (
                <div className="flex w-fit flex-wrap gap-1">
                  {competition.countyNames.map((name) => (
                    <CountyChip key={name} name={name} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 border-t border-border pt-3.5 @5xl:w-72 @5xl:shrink-0 @5xl:border-t-0 @5xl:border-s @5xl:pt-0 @5xl:ps-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CountdownChip deadline={competition.registrationDeadline} />
                <span className="text-subtle text-muted-foreground tabular-nums">
                  مهلت: {formatJalaliDate(new Date(competition.registrationDeadline))}
                </span>
              </div>
              <DeadlineProgress startedAt={competition.createdAt} deadline={competition.registrationDeadline} />
              <p className="text-subtle text-muted-foreground">
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatRialsAsToman(Number(competition.feePerStudent))}
                </span>{" "}
                هر هنرجو
              </p>
              <Button
                className="h-11 w-full @5xl:h-9 @5xl:w-auto @5xl:self-start"
                render={<Link href={`/coach/competitions/${competition.id}/register`} />}
              >
                ثبت نام
                <ArrowLeftIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
