"use client";

import { ScaleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorBanner, SearchInput } from "@/components/shared";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SkeletonRows } from "@/components/shared/rows-skeleton";
import { formatNumber } from "@/lib/format";
import { ApiError } from "@/lib/http";
import { useEventDay } from "../hooks/use-event-day";
import { EventDayCards } from "./event-day-cards";
import { EventDaySummary } from "./event-day-summary";
import { EventDayTable } from "./event-day-table";
import type { EventDayFilter } from "./use-event-day-view";
import { useEventDayView } from "./use-event-day-view";

export function EventDaySection({ competitionId }: { competitionId: string }) {
  const { eventDay, isLoading, error, reload, saveWeighIn, saveCheckIn } = useEventDay(competitionId);
  const [busyId, setBusyId] = useState<string | null>(null);

  const kyorugi = eventDay?.competition.discipline === "KYORUGI";
  const view = useEventDayView(eventDay?.rows ?? [], kyorugi === true);

  async function run(id: string, action: () => Promise<void>, successMessage: string, failureMessage: string) {
    setBusyId(id);
    try {
      await action();
      toast.success(successMessage);
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : failureMessage);
    } finally {
      setBusyId(null);
    }
  }

  const onWeigh = (id: string, weightKg: number) =>
    run(id, () => saveWeighIn(id, weightKg), "وزن ثبت شد.", "ثبت وزن انجام نشد. دوباره تلاش کنید.");

  const onCheckIn = (id: string, checkedIn: boolean) =>
    run(id, () => saveCheckIn(id, checkedIn), checkedIn ? "حضور ثبت شد." : "حضور حذف شد.", "ثبت حضور انجام نشد. دوباره تلاش کنید.");

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">روز مسابقه</h2>
        {eventDay ? (
          <span className="text-subtle text-muted-foreground tabular-nums">({formatNumber(eventDay.summary.approved)} نفر)</span>
        ) : null}
      </div>

      {error ? (
        <ErrorBanner message="دریافت اطلاعات روز مسابقه ناموفق بود." onRetry={reload} />
      ) : isLoading ? (
        <SkeletonRows rows={4} className="h-12" />
      ) : !eventDay || eventDay.rows.length === 0 ? (
        <EmptyState icon={ScaleIcon} title="هنوز شرکت کننده تأیید شده ای برای این مسابقه وجود ندارد." tone="primary" />
      ) : (
        <>
          <EventDaySummary summary={eventDay.summary} kyorugi={kyorugi === true} />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs items={view.tabs} value={view.filter} onChange={(id) => view.setFilter(id as EventDayFilter)} />
            <SearchInput
              value={view.query}
              onChange={view.setQuery}
              placeholder="جستجوی هنرجو، مربی یا کد ملی"
              label="جستجوی شرکت کنندگان"
            />
          </div>

          {view.filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">نتیجه ای یافت نشد.</p>
          ) : (
            <>
              <div className="hidden md:block">
                <EventDayTable rows={view.filtered} kyorugi={kyorugi === true} busyId={busyId} onWeigh={onWeigh} onCheckIn={onCheckIn} />
              </div>
              <EventDayCards rows={view.filtered} kyorugi={kyorugi === true} busyId={busyId} onWeigh={onWeigh} onCheckIn={onCheckIn} />
            </>
          )}
        </>
      )}
    </section>
  );
}
