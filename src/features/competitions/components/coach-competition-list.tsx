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
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3.5 last:border-b-0 @lg:flex-nowrap"
        >
          <IconTile icon={disciplineIcons[competition.discipline]} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{competition.title}</p>
            <p className="text-subtle text-muted-foreground">
              {disciplineLabels[competition.discipline]} · رده سنی {ageCategoryLabel(competition.ageCategoryId)} ·{" "}
              {genderLabels[competition.gender]}
            </p>
          </div>
          <CountdownChip deadline={competition.registrationDeadline} />
          <span className="text-subtle whitespace-nowrap text-muted-foreground">
            {formatRialsAsToman(Number(competition.feePerStudent))} <span className="text-xs">هر هنرجو</span>
          </span>
          <Button size="sm" className="h-11 md:h-8" render={<Link href={`/coach/competitions/${competition.id}/register`} />}>
            ثبت‌نام
            <ArrowLeftIcon data-icon="inline-end" />
          </Button>
        </div>
      ))}
    </div>
  );
}
