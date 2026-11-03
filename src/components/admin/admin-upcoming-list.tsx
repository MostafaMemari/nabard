"use client";

import Link from "next/link";
import { CountdownChip, IconTile } from "@/components/shared";
import { type Competition, disciplineIcons } from "@/features/competitions";
import { formatNumber } from "@/lib/format";

export function AdminUpcomingList({
  competitions,
  registrationCount,
}: {
  competitions: Competition[];
  registrationCount: (competitionId: string) => number;
}) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {competitions.map((competition) => (
        <Link
          key={competition.id}
          href={`/admin/competitions/${competition.id}`}
          className="flex min-h-11 items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/50"
        >
          <IconTile icon={disciplineIcons[competition.discipline]} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{competition.title}</p>
            <p className="text-subtle mt-0.5 text-muted-foreground tabular-nums">
              {formatNumber(registrationCount(competition.id))} ثبت نام
            </p>
          </div>
          <CountdownChip deadline={competition.registrationDeadline} />
        </Link>
      ))}
    </div>
  );
}
