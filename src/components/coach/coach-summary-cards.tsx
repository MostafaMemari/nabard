"use client";

import { SummaryCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

export function CoachSummaryCards({
  openCompetitions,
  registrationsCount,
  awaitingReview,
  isLoading,
}: {
  openCompetitions: number;
  registrationsCount: number;
  awaitingReview: number;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {isLoading ? (
        <>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </>
      ) : (
        <>
          <SummaryCard value={formatNumber(openCompetitions)} label="مسابقات باز" href="/coach/competitions" linkLabel="مشاهده مسابقات" />
          <SummaryCard
            value={formatNumber(registrationsCount)}
            label="ثبت نام های من"
            href="/coach/registrations"
            linkLabel="مشاهده ثبت نام ها"
          />
          <SummaryCard value={formatNumber(awaitingReview)} label="پرداخت های در انتظار بررسی" />
        </>
      )}
    </div>
  );
}
