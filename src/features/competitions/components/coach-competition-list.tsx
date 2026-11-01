"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { CountdownChip, IconTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ageCategoryLabel, genderLabels } from "@/features/base-data";
import { formatRialsAsToman } from "@/lib/format";
import { disciplineIcons, disciplineLabels } from "../labels";
import type { Competition } from "../types";

export function CoachCompetitionList({ competitions }: { competitions: Competition[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {competitions.map((competition) => (
        <div
          key={competition.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border p-4 last:border-b-0 @lg:flex-nowrap @lg:gap-x-4 @lg:px-4 @lg:py-3.5"
        >
          <IconTile icon={disciplineIcons[competition.discipline]} />
          <div className="min-w-52 flex-1 @lg:min-w-0">
            <Link
              href={`/coach/competitions/${competition.id}`}
              className="truncate text-sm font-medium underline-offset-4 hover:underline"
            >
              {competition.title}
            </Link>
            <p className="text-subtle truncate text-muted-foreground">
              {disciplineLabels[competition.discipline]} · رده سنی {ageCategoryLabel(competition.ageCategoryId)} ·{" "}
              {genderLabels[competition.gender]}
            </p>
          </div>
          <CountdownChip deadline={competition.registrationDeadline} />
          <span className="text-subtle whitespace-nowrap text-muted-foreground">
            {formatRialsAsToman(Number(competition.feePerStudent))} <span className="text-xs">هر هنرجو</span>
          </span>
          <Button
            size="sm"
            className="h-11 w-full @lg:h-8 @lg:w-auto"
            render={<Link href={`/coach/competitions/${competition.id}/register`} />}
          >
            ثبت نام
            <ArrowLeftIcon data-icon="inline-end" />
          </Button>
        </div>
      ))}
    </div>
  );
}
