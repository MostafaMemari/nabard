"use client";

import { ClipboardListIcon, ReceiptTextIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { DescriptionList, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentStatusKey, RegistrationTimeline, registrationStatusKey } from "@/features/registrations";
import { formatJalaliDateTime, formatRialsAsToman } from "@/lib/format";
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
    return <ErrorBanner message="ثبت نامی با این شماره پیدا نشد." onRetry={() => void retry()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/coach/registrations"
        backLabel="ثبت نام های من"
        title={row.studentName ?? "—"}
        description={row.competitionTitle}
        action={<StatusBadge status={registrationStatusKey(row.registration.status)} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="flex items-center gap-3">
            <IconTile icon={ClipboardListIcon} />
            <h2 className="text-base font-semibold">وضعیت ثبت نام</h2>
          </div>
          <RegistrationTimeline registration={row.registration} paymentStatus={row.paymentStatus} />
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile icon={ReceiptTextIcon} />
              <h2 className="text-base font-semibold">اطلاعات ثبت نام</h2>
            </div>
            <DescriptionList
              items={[
                { term: "رده وزنی", value: row.weightClassLabel ?? "—" },
                { term: "تاریخ ثبت نام", value: formatJalaliDateTime(new Date(row.registration.createdAt)) },
                { term: "مبلغ", value: row.paymentAmount ? formatRialsAsToman(Number(row.paymentAmount)) : "—" },
                {
                  term: "وضعیت رسید",
                  value: row.paymentStatus ? <StatusBadge status={paymentStatusKey(row.paymentStatus)} /> : "—",
                },
              ]}
            />
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile icon={TrophyIcon} />
              <h2 className="text-base font-semibold">مسابقه</h2>
            </div>
            <p className="text-sm font-medium">{row.competitionTitle}</p>
            <DescriptionList
              items={[
                {
                  term: "مهلت ثبت نام",
                  value: row.competitionDeadline ? formatJalaliDateTime(new Date(row.competitionDeadline)) : "—",
                },
              ]}
            />
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/coach/competitions/${row.registration.competitionId}`} />}
              className="w-fit"
            >
              مشاهده مسابقه
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
