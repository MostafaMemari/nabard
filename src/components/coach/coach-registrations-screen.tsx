"use client";

import { DataTable, EmptyState, PageHeader } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachRegistrationCards, coachRegistrationColumns } from "@/features/registrations";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

export function CoachRegistrationsScreen({ coachId }: { coachId: string }) {
  const { rows, isLoading, error, mutate } = useCoachRegistrationRows(coachId);

  return (
    <>
      <PageHeader title="ثبت‌نام‌های من" description="پیگیری وضعیت ثبت‌نام و پرداخت هنرجویان." />
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>دریافت اطلاعات ناموفق بود.</span>
          <button type="button" onClick={() => void mutate()} className="font-medium hover:underline">
            تلاش دوباره
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          {["r1", "r2", "r3", "r4", "r5"].map((key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState title="هنوز ثبت‌نامی انجام نشده است." />
        </div>
      ) : (
        <>
          <div className="hidden @lg:block">
            <DataTable columns={coachRegistrationColumns()} rows={rows} getRowId={(row) => row.registration.id} />
          </div>
          <div className="@lg:hidden">
            <CoachRegistrationCards rows={rows} />
          </div>
        </>
      )}
    </>
  );
}
