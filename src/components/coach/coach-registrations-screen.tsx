"use client";

import { ClipboardListIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, EmptyState, PageHeader, SkeletonRows } from "@/components/shared";
import { CoachRegistrationCard, coachRegistrationColumns } from "@/features/registrations";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

export function CoachRegistrationsScreen({ coachId }: { coachId: string }) {
  const router = useRouter();
  const { rows, isLoading, error, mutate } = useCoachRegistrationRows(coachId);

  return (
    <>
      <PageHeader title="ثبت نام های من" description="پیگیری وضعیت ثبت نام و پرداخت هنرجویان." />
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>دریافت اطلاعات ناموفق بود.</span>
          <button type="button" onClick={() => void mutate()} className="font-medium hover:underline">
            تلاش دوباره
          </button>
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <SkeletonRows rows={5} className="h-12" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <EmptyState icon={ClipboardListIcon} title="هنوز ثبت نامی انجام نشده است." />
        </div>
      ) : (
        <DataTable
          columns={coachRegistrationColumns()}
          rows={rows}
          getRowId={(row) => row.registration.id}
          onRowClick={(row) => router.push(`/coach/registrations/${row.registration.id}`)}
          renderCard={(row) => <CoachRegistrationCard row={row} />}
        />
      )}
    </>
  );
}
