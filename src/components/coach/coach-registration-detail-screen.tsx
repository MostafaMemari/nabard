"use client";

import { ClipboardListIcon, ReceiptTextIcon } from "lucide-react";
import { DescriptionList, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentStatusKey, RegistrationTimeline, registrationStatusKey } from "@/features/registrations";
import { formatJalaliDateTime } from "@/lib/format";
import { useCoachRegistrationDetail } from "./use-coach-registration-detail";

export function CoachRegistrationDetailScreen({ coachId, registrationId }: { coachId: string; registrationId: string }) {
  const { row, isLoading, error, retry } = useCoachRegistrationDetail({ coachId, registrationId });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !row) {
    return <ErrorBanner message="ثبت‌نام یافت نشد." onRetry={() => void retry()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/coach/registrations"
        backLabel="ثبت‌نام‌های من"
        title={row.studentName ?? "—"}
        description={row.competitionTitle}
        action={<StatusBadge status={registrationStatusKey(row.registration.status)} />}
      />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center gap-3">
          <IconTile icon={ClipboardListIcon} />
          <h2 className="text-base font-semibold">وضعیت ثبت‌نام</h2>
        </div>
        <RegistrationTimeline registration={row.registration} paymentStatus={row.paymentStatus} />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center gap-3">
          <IconTile icon={ReceiptTextIcon} />
          <h2 className="text-base font-semibold">اطلاعات ثبت‌نام</h2>
        </div>
        <DescriptionList
          items={[
            { term: "رده وزنی", value: row.weightClassLabel ?? "—" },
            { term: "تاریخ ثبت‌نام", value: formatJalaliDateTime(new Date(row.registration.createdAt)) },
            {
              term: "وضعیت رسید",
              value: row.paymentStatus ? <StatusBadge status={paymentStatusKey(row.paymentStatus)} /> : "—",
            },
          ]}
        />
      </section>
    </div>
  );
}
