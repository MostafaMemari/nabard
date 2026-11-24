"use client";

import { ClipboardListIcon, ReceiptTextIcon, TrophyIcon } from "lucide-react";
import { SummaryCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
      {isLoading ? (
        <>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="hidden h-28 w-full sm:block" />
        </>
      ) : (
        <>
          <SummaryCard value={openCompetitions} label="مسابقات باز" href="/coach/competitions" icon={TrophyIcon} />
          <SummaryCard value={registrationsCount} label="ثبت نام های من" href="/coach/registrations" icon={ClipboardListIcon} />
          <SummaryCard value={awaitingReview} label="پرداخت در انتظار بررسی" icon={ReceiptTextIcon} tone="warning" />
        </>
      )}
    </div>
  );
}
