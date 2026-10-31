"use client";

import { ClipboardListIcon, HourglassIcon, TrophyIcon } from "lucide-react";
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
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </>
      ) : (
        <>
          <SummaryCard
            icon={TrophyIcon}
            value={formatNumber(openCompetitions)}
            label="مسابقات باز"
            href="/coach/competitions"
            linkLabel="مشاهده مسابقات"
          />
          <SummaryCard
            icon={ClipboardListIcon}
            value={formatNumber(registrationsCount)}
            label="ثبت‌نام‌های من"
            href="/coach/registrations"
            linkLabel="مشاهده ثبت‌نام‌ها"
          />
          <SummaryCard icon={HourglassIcon} tone="warning" value={formatNumber(awaitingReview)} label="پرداخت‌های در انتظار بررسی" />
        </>
      )}
    </div>
  );
}
