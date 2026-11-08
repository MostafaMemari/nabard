"use client";

import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CountdownChip, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { genderLabels, useBelts } from "@/features/base-data";
import { EventDaySection, useRegistrations } from "@/features/registrations";
import { updateCompetition } from "../api";
import { useCompetition } from "../hooks/use-competitions";
import { disciplineIcons, disciplineLabels } from "../labels";
import { CompetitionDescriptionDialog } from "./competition-description-dialog";
import { CompetitionInfoSections } from "./competition-info-sections";
import { CompetitionParticipants } from "./competition-participants";
import { CompetitionRegistrations } from "./competition-registrations";
import { CompetitionStatusActions } from "./competition-status-actions";
import { useWeightClassesFor } from "./use-weight-classes-for";

export function CompetitionDetailScreen({ competitionId }: { competitionId: string }) {
  const { competition, isLoading, error, mutate } = useCompetition(competitionId);
  const { registrations } = useRegistrations();
  const { belts } = useBelts();
  const { weightClasses } = useWeightClassesFor(competition);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  async function saveDescription(description: string) {
    if (!competition) return;
    setDescriptionSaving(true);
    try {
      await updateCompetition(competitionId, { description: description.trim() ? description.trim() : null });
      toast.success("توضیحات مسابقه ذخیره شد.");
      setDescriptionOpen(false);
      await mutate();
    } catch {
      toast.error("ذخیره توضیحات انجام نشد. دوباره تلاش کنید.");
    } finally {
      setDescriptionSaving(false);
    }
  }

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
        description={`${disciplineLabels[competition.discipline]} · ${competition.ageCategoryLabel} · ${genderLabels[competition.gender]}`}
        action={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" disabled={hasRegistrations} render={<Link href={`/admin/competitions/${competitionId}/edit`} />}>
              <PencilIcon data-icon="inline-start" />
              ویرایش
            </Button>
            <CompetitionStatusActions competition={competition} onChanged={mutate} />
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between md:p-6 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <IconTile icon={disciplineIcons[competition.discipline]} />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={competition.status} />
            <CountdownChip deadline={competition.registrationDeadline} />
          </div>
        </div>
        {hasRegistrations ? <p className="text-subtle text-muted-foreground">به دلیل وجود ثبت نام، ویرایش این مسابقه ممکن نیست.</p> : null}
      </div>

      <CompetitionInfoSections
        competition={competition}
        belts={belts}
        weightClassCount={weightClasses.length}
        onEditDescription={() => setDescriptionOpen(true)}
      />

      <CompetitionRegistrations competitionId={competitionId} ageCategoryId={competition.ageCategoryId} gender={competition.gender} />

      {competition.status === "PUBLISHED" ? <EventDaySection competitionId={competitionId} /> : null}

      <CompetitionParticipants competitionId={competitionId} />

      <CompetitionDescriptionDialog
        open={descriptionOpen}
        onOpenChange={setDescriptionOpen}
        initialValue={competition.description ?? ""}
        loading={descriptionSaving}
        onConfirm={saveDescription}
      />
    </div>
  );
}
