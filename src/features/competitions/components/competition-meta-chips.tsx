"use client";

import { cn } from "cn";
import { UsersIcon } from "lucide-react";
import { genderLabels } from "@/features/base-data";
import { disciplineIcons, disciplineLabels } from "../labels";
import type { Competition } from "../types";

const chipClass = "inline-flex h-6 w-fit items-center gap-1 rounded-full px-2.5 text-subtle font-medium whitespace-nowrap";

// The sticker row under a competition title: discipline, age category and
// gender as separate side-by-side chips instead of one dotted line.
export function CompetitionMetaChips({
  competition,
  className,
}: {
  competition: Pick<Competition, "discipline" | "ageCategoryLabel" | "gender">;
  className?: string;
}) {
  const DisciplineIcon = disciplineIcons[competition.discipline];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className={cn(chipClass, "bg-primary-subtle text-primary")}>
        <DisciplineIcon aria-hidden className="size-3.5" strokeWidth={1.75} />
        {disciplineLabels[competition.discipline]}
      </span>
      <span className={cn(chipClass, "bg-muted text-muted-foreground")}>
        <UsersIcon aria-hidden className="size-3.5" strokeWidth={1.75} />
        {competition.ageCategoryLabel}
      </span>
      <span className={cn(chipClass, "border border-border bg-card text-muted-foreground")}>{genderLabels[competition.gender]}</span>
    </div>
  );
}
