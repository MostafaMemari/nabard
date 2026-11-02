"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { CountdownChip, DeadlineProgress, IconTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { genderLabels } from "@/features/base-data";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";
import { disciplineIcons, disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { CountyChip } from "./county-chip";

export function CoachCompetitionList({ competitions }: { competitions: Competition[] }) {
  return (
    <div className="flex flex-col gap-3">
      {competitions.map((competition) => (
        <article key={competition.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <IconTile icon={disciplineIcons[competition.discipline]} />
            <div className="min-w-0 flex-1 leading-tight">
              <Link
                href={`/coach/competitions/${competition.id}`}
                className="block truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                {competition.title}
              </Link>
              <p className="text-subtle mt-0.5 truncate text-muted-foreground">
                {disciplineLabels[competition.discipline]} · {competition.ageCategoryLabel} · {genderLabels[competition.gender]}
              </p>
              {competition.level === "COUNTY" && competition.countyNames.length > 0 ? (
                <span className="mt-1.5 flex w-fit flex-wrap gap-1">
                  {competition.countyNames.map((name) => (
                    <CountyChip key={name} name={name} />
                  ))}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <CountdownChip deadline={competition.registrationDeadline} />
            <span className="text-subtle text-xs text-muted-foreground">
              مهلت: {formatJalaliDate(new Date(competition.registrationDeadline))}
            </span>
          </div>
          <DeadlineProgress startedAt={competition.createdAt} deadline={competition.registrationDeadline} />

          <div className="flex flex-col gap-3 border-t border-border pt-3 @5xl:flex-row @5xl:items-center @5xl:justify-between">
            <p className="text-subtle text-muted-foreground">
              <span className="text-sm font-semibold text-foreground">{formatRialsAsToman(Number(competition.feePerStudent))}</span> هر
              هنرجو
            </p>
            <Button className="h-11 w-full @5xl:h-9 @5xl:w-auto" render={<Link href={`/coach/competitions/${competition.id}/register`} />}>
              ثبت نام
              <ArrowLeftIcon data-icon="inline-end" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
