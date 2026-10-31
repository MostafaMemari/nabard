"use client";

import { ArrowLeftIcon, HistoryIcon, TimerIcon } from "lucide-react";
import Link from "next/link";
import { CountdownLarge, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ageCategoryLabel, genderLabels, useBelts } from "@/features/base-data";
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
        description={`${disciplineLabels[competition.discipline]} · ${genderLabels[competition.gender]} · رده ${ageCategoryLabel(competition.ageCategoryId)}`}
        action={
          open ? (
            <Button render={<Link href={`/coach/competitions/${competitionId}/register`} />}>
              ثبت‌نام هنرجویان
              <ArrowLeftIcon data-icon="inline-end" />
            </Button>
          ) : null
        }
      />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconTile icon={TimerIcon} />
            <h2 className="text-base font-semibold">مهلت ثبت‌نام</h2>
          </div>
          <StatusBadge status={competition.status} />
        </div>
        <CountdownLarge deadline={competition.registrationDeadline} startedAt={competition.createdAt} />
        {!open ? (
          <Button variant="ghost" className="w-fit" render={<Link href="/coach/registrations" />}>
            <HistoryIcon data-icon="inline-start" />
            مشاهده سوابق
          </Button>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center gap-3">
          <IconTile icon={disciplineIcons[competition.discipline]} />
          <h2 className="text-base font-semibold">اطلاعات مسابقه</h2>
        </div>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <FactLine label="تاریخ برگزاری" value={formatJalaliDate(new Date(competition.eventDate))} />
          <FactLine label="هزینه هر هنرجو" value={formatRialsAsToman(Number(competition.feePerStudent))} />
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-subtle text-muted-foreground">کمربندها:</span>
          <BeltChips belts={belts} ids={competition.beltIds} />
        </div>
      </section>
    </div>
  );
}

function FactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
      <dt className="text-subtle text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
