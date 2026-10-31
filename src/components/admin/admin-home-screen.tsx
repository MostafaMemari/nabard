"use client";

import { startOfWeek } from "date-fns-jalali";
import { useMemo } from "react";
import { HomeListSection, PageHeader, SummaryCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompetitions } from "@/features/competitions";
import { usePayments } from "@/features/payments";
import { useRegistrations } from "@/features/registrations";
import { formatNumber } from "@/lib/format";
import { AdminActionList } from "./admin-action-list";
import { AdminUpcomingList } from "./admin-upcoming-list";

export function AdminHomeScreen() {
  const { payments, isLoading: paymentsLoading, error: paymentsError, mutate: retryPayments } = usePayments();
  const { competitions, isLoading: competitionsLoading, error: competitionsError, mutate: retryCompetitions } = useCompetitions();
  const { registrations, isLoading: registrationsLoading } = useRegistrations();

  const pendingPayments = useMemo(() => payments.filter((payment) => payment.status === "PENDING").slice(0, 5), [payments]);
  const pendingCount = useMemo(() => payments.filter((payment) => payment.status === "PENDING").length, [payments]);
  const upcoming = useMemo(
    () =>
      competitions
        .filter((competition) => competition.status === "PUBLISHED")
        .sort((a, b) => a.registrationDeadline.localeCompare(b.registrationDeadline))
        .slice(0, 5),
    [competitions],
  );
  const weekCount = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 6 }).getTime();
    return registrations.filter((registration) => new Date(registration.createdAt).getTime() >= start).length;
  }, [registrations]);

  const isLoading = paymentsLoading || competitionsLoading || registrationsLoading;

  return (
    <>
      <PageHeader title="خانه" description="نمای کلی مسابقات، پرداخت‌ها و مربیان." />

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((key) => <Skeleton key={key} className="h-24 w-full" />)
        ) : (
          <>
            <SummaryCard
              value={formatNumber(pendingCount)}
              label="رسیدهای در انتظار بررسی"
              href="/admin/payments?status=pending"
              linkLabel="مشاهده پرداخت‌ها"
            />
            <SummaryCard value={formatNumber(upcoming.length)} label="مسابقات باز" href="/admin/competitions" linkLabel="مشاهده مسابقات" />
            <SummaryCard value={formatNumber(weekCount)} label="ثبت‌نام‌های این هفته" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HomeListSection
          title="نیازمند اقدام"
          href="/admin/payments?status=pending"
          error={paymentsError}
          onRetry={() => void retryPayments()}
          isLoading={paymentsLoading}
          isEmpty={pendingPayments.length === 0}
          empty={<p className="px-4 py-10 text-center text-sm text-muted-foreground">پرداختی برای بررسی وجود ندارد.</p>}
        >
          <AdminActionList payments={pendingPayments} />
        </HomeListSection>

        <HomeListSection
          title="مسابقات پیش‌رو"
          href="/admin/competitions"
          error={competitionsError}
          onRetry={() => void retryCompetitions()}
          isLoading={competitionsLoading}
          isEmpty={upcoming.length === 0}
          empty={<p className="px-4 py-10 text-center text-sm text-muted-foreground">هنوز مسابقه‌ای ثبت نشده است.</p>}
        >
          <AdminUpcomingList
            competitions={upcoming}
            registrationCount={(id) => registrations.filter((r) => r.competitionId === id).length}
          />
        </HomeListSection>
      </div>
    </>
  );
}
