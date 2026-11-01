"use client";

import { ClipboardListIcon, ReceiptTextIcon, TrophyIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { DescriptionList, DetailPageHeader, ErrorBanner, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentStatusKey, RegistrationTimeline, registrationStatusKey } from "@/features/registrations";
import { formatJalaliDateTime, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { useCoachRegistrationDetail } from "./use-coach-registration-detail";

export function CoachRegistrationDetailScreen({ registrationId }: { registrationId: string }) {
  const { detail, isLoading, error, retry } = useCoachRegistrationDetail({ registrationId });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return <ErrorBanner message="ثبت نامی با این شماره پیدا نشد." onRetry={() => void retry()} />;
  }

  const { registration, competition, payment, bundle } = detail;

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/coach/registrations"
        backLabel="ثبت نام های من"
        title={registration.student.fullName}
        description={competition?.title ?? "-"}
        action={<StatusBadge status={registrationStatusKey(registration.status)} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
            <div className="flex items-center gap-3">
              <IconTile icon={ClipboardListIcon} />
              <h2 className="text-base font-semibold">وضعیت ثبت نام</h2>
            </div>
            <RegistrationTimeline registration={registration} paymentStatus={payment?.status ?? null} />
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconTile icon={UsersIcon} />
                <h2 className="text-base font-semibold">هنرجوهای این رسید</h2>
              </div>
              <span className="text-subtle text-muted-foreground">پرداخت مشترک</span>
            </div>
            <ul className="flex flex-col divide-y divide-border">
              {bundle.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{item.studentName}</span>
                    <StatusBadge status={registrationStatusKey(item.status)} />
                  </div>
                  {item.status === "REJECTED" && item.note ? <p className="text-subtle text-sm text-danger">دلیل رد: {item.note}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile icon={ReceiptTextIcon} />
              <h2 className="text-base font-semibold">اطلاعات ثبت نام</h2>
            </div>
            <DescriptionList
              items={[
                { term: "رده وزنی", value: detail.weightClassLabel ? `${toPersianDigits(detail.weightClassLabel)} کیلوگرم` : "-" },
                { term: "تاریخ ثبت نام", value: formatJalaliDateTime(new Date(registration.createdAt)) },
                { term: "مبلغ", value: payment ? formatRialsAsToman(Number(payment.amount)) : "-" },
                {
                  term: "وضعیت رسید",
                  value: payment ? <StatusBadge status={paymentStatusKey(payment.status)} /> : "-",
                },
              ]}
            />
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <IconTile icon={TrophyIcon} />
              <h2 className="text-base font-semibold">مسابقه</h2>
            </div>
            <p className="text-sm font-medium">{competition?.title ?? "-"}</p>
            <DescriptionList
              items={[
                {
                  term: "مهلت ثبت نام",
                  value: competition ? formatJalaliDateTime(new Date(competition.registrationDeadline)) : "-",
                },
              ]}
            />
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/coach/competitions/${registration.competitionId}`} />}
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
