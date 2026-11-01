"use client";

import { useMemo } from "react";
import { EmptyState, PageHeader } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachCompetitionList, useCompetitions } from "@/features/competitions";

export function CoachCompetitionsScreen() {
  const { competitions, isLoading, error, mutate } = useCompetitions({ status: "PUBLISHED" });

  const openCompetitions = useMemo(
    () => competitions.filter((competition) => new Date(competition.registrationDeadline).getTime() >= Date.now()),
    [competitions],
  );

  return (
    <>
      <PageHeader title="مسابقات" description="مسابقاتی که ثبت نام آن ها باز است." />
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>دریافت اطلاعات ناموفق بود.</span>
          <button type="button" onClick={() => void mutate()} className="font-medium hover:underline">
            تلاش دوباره
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {["c1", "c2", "c3"].map((key) => (
            <Skeleton key={key} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : openCompetitions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState title="مسابقه بازی برای ثبت نام وجود ندارد." />
        </div>
      ) : (
        <CoachCompetitionList competitions={openCompetitions} />
      )}
    </>
  );
}
