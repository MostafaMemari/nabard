"use client";

import { ArrowLeftIcon, HistoryIcon, TimerIcon } from "lucide-react";
import Link from "next/link";
import { CountdownLarge, DescriptionList, DetailPageHeader, ErrorBanner, SectionCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { genderLabels, useBelts } from "@/features/base-data";
import { BeltChips, disciplineIcons, disciplineLabels, useCompetition } from "@/features/competitions";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";

export function CoachCompetitionDetailScreen({ competitionId }: { competitionId: string }) {
  const { competition, isLoading, error, mutate } = useCompetition(competitionId);
  const { belts } = useBelts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error || !competition) {
    return <ErrorBanner message="مسابقه یافت نشد." onRetry={() => mutate()} />;
  }

  const open = competition.status === "PUBLISHED" && new Date(competition.registrationDeadline).getTime() > Date.now();

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/coach/competitions"
        backLabel="مسابقات"
        title={competition.title}
        description={`${disciplineLabels[competition.discipline]} · ${competition.ageCategoryLabel} · ${genderLabels[competition.gender]}`}
        action={
          open ? (
            <Button render={<Link href={`/coach/competitions/${competitionId}/register`} />}>
              ثبت نام هنرجویان
              <ArrowLeftIcon data-icon="inline-end" />
            </Button>
          ) : null
        }
      />

      <SectionCard title="مهلت ثبت نام" icon={TimerIcon} action={<StatusBadge status={competition.status} />}>
        <CountdownLarge deadline={competition.registrationDeadline} startedAt={competition.createdAt} />
        {!open ? (
          <Button variant="ghost" className="w-fit" render={<Link href="/coach/registrations" />}>
            <HistoryIcon data-icon="inline-start" />
            مشاهده سوابق
          </Button>
        ) : null}
      </SectionCard>

      <SectionCard title="اطلاعات مسابقه" icon={disciplineIcons[competition.discipline]}>
        <DescriptionList
          items={[
            { term: "تاریخ برگزاری", value: formatJalaliDate(new Date(competition.eventDate)) },
            { term: "هزینه هر هنرجو", value: formatRialsAsToman(Number(competition.feePerStudent)) },
          ]}
        />
        {competition.beltIds.some((id) => belts.some((belt) => belt.id === id)) ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-subtle text-muted-foreground">کمربندها:</span>
            <BeltChips belts={belts} ids={competition.beltIds} />
          </div>
        ) : null}
        {competition.description ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <span className="text-subtle text-sm font-medium text-muted-foreground">توضیحات مسابقه:</span>
            <p className="text-sm leading-7 whitespace-pre-line">{competition.description}</p>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
