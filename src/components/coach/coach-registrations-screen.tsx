"use client";

import { ClipboardListIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, EmptyState, ErrorBanner, PageHeader, SkeletonRows, StateCard } from "@/components/shared";
import { CoachRegistrationCard, coachRegistrationColumns } from "@/features/registrations";
import { CoachRefundsList } from "./coach-refunds-list";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

export function CoachRegistrationsScreen() {
  const router = useRouter();
  const { rows, isLoading, error, mutate } = useCoachRegistrationRows();

  return (
    <>
      <PageHeader title="ثبت نام های من" description="پیگیری وضعیت ثبت نام و پرداخت هنرجویان." />
      {error ? (
        <ErrorBanner onRetry={() => void mutate()} />
      ) : isLoading ? (
        <StateCard className="p-4">
          <SkeletonRows rows={5} className="h-12" />
        </StateCard>
      ) : rows.length === 0 ? (
        <StateCard>
          <EmptyState icon={ClipboardListIcon} title="هنوز ثبت نامی انجام نشده است." />
        </StateCard>
      ) : (
        <DataTable
          columns={coachRegistrationColumns()}
          rows={rows}
          getRowId={(row) => row.registration.id}
          onRowClick={(row) => router.push(`/coach/registrations/${row.registration.id}`)}
          renderCard={(row) => <CoachRegistrationCard row={row} />}
        />
      )}
      <CoachRefundsList />
    </>
  );
}
