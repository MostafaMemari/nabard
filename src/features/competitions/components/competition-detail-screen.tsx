"use client";

import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { CountdownChip, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ageCategoryLabel, genderLabels, useBelts, useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { useCompetition } from "../hooks/use-competitions";
import { disciplineIcons, disciplineLabels } from "../labels";
import { CompetitionInfoSections } from "./competition-info-sections";
import { CompetitionRegistrations } from "./competition-registrations";
import { CompetitionStatusActions } from "./competition-status-actions";

export function CompetitionDetailScreen({ competitionId }: { competitionId: string }) {
  const { competition, isLoading, error, mutate } = useCompetition(competitionId);
  const { registrations } = useRegistrations();
  const { belts } = useBelts();
  const { weightClasses } = useWeightClasses(competition ? { ageCategoryId: competition.ageCategoryId, gender: competition.gender } : {});

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return <ErrorBanner message="مسابقه یافت نشد." onRetry={() => mutate()} />;
  }

  const hasRegistrations = registrations.some((registration) => registration.competitionId === competitionId);

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/admin/competitions"
        backLabel="مسابقات"
        title={competition.title}
        description={`${disciplineLabels[competition.discipline]} · ${genderLabels[competition.gender]} · رده ${ageCategoryLabel(competition.ageCategoryId)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={hasRegistrations} render={<Link href={`/admin/competitions/${competitionId}/edit`} />}>
              <PencilIcon data-icon="inline-start" />
              ویرایش
            </Button>
            <CompetitionStatusActions competition={competition} onChanged={mutate} />
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <IconTile icon={disciplineIcons[competition.discipline]} />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={competition.status} />
            <CountdownChip deadline={competition.registrationDeadline} />
          </div>
        </div>
        {hasRegistrations ? <p className="text-subtle text-muted-foreground">به دلیل وجود ثبت‌نام، ویرایش این مسابقه ممکن نیست.</p> : null}
      </div>

      <CompetitionInfoSections competition={competition} belts={belts} weightClassCount={weightClasses.length} />

      <CompetitionRegistrations competitionId={competitionId} ageCategoryId={competition.ageCategoryId} gender={competition.gender} />
    </div>
  );
}
