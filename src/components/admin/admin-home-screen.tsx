"use client";

import { PlusIcon, ReceiptTextIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, HomeListSection, PageHeader, SummaryCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSummary } from "@/features/summary";
import { formatNumber } from "@/lib/format";
import { AdminActionList } from "./admin-action-list";
import { AdminUpcomingList } from "./admin-upcoming-list";

export function AdminHomeScreen() {
  const { summary, isLoading, error, mutate } = useSummary();

  return (
    <>
      <PageHeader title="خانه" description="رسیدهای در انتظار بررسی و مسابقات پیش رو." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading || !summary ? (
          [1, 2, 3, 4, 5, 6].map((key) => <Skeleton key={key} className="h-32 w-full" />)
        ) : (
          <>
            <SummaryCard
              value={formatNumber(summary.pendingPaymentsCount)}
              label="رسیدهای در انتظار بررسی"
              href="/admin/payments?status=pending"
              linkLabel="مشاهده پرداخت ها"
            />
            <SummaryCard
              value={formatNumber(summary.pendingProfilesCount)}
              label="پروفایل های در انتظار تایید"
              href="/admin/profiles"
              linkLabel="بررسی پروفایل ها"
            />
            <SummaryCard
              value={formatNumber(summary.pendingRefundsCount)}
              label="بازپرداخت های در انتظار"
              href="/admin/refunds?status=pending"
              linkLabel="مشاهده بازپرداخت ها"
            />
            <SummaryCard
              value={formatNumber(summary.pendingCountyChangesCount)}
              label="درخواست های تغییر شهرستان"
              href="/admin/county-changes?status=pending"
              linkLabel="بررسی درخواست ها"
            />
            <SummaryCard
              value={formatNumber(summary.openCompetitionsCount)}
              label="مسابقات باز"
              href="/admin/competitions"
              linkLabel="مشاهده مسابقات"
            />
            <SummaryCard value={formatNumber(summary.weeklyRegistrationsCount)} label="ثبت نام های این هفته" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HomeListSection
          title="نیازمند اقدام"
          href="/admin/payments?status=pending"
          error={error}
          onRetry={() => void mutate()}
          isLoading={isLoading}
          isEmpty={(summary?.latestPendingPayments.length ?? 0) === 0}
          empty={<EmptyState icon={ReceiptTextIcon} title="پرداختی برای بررسی وجود ندارد." />}
        >
          {summary ? <AdminActionList payments={summary.latestPendingPayments} /> : null}
        </HomeListSection>

        <HomeListSection
          title="مسابقات پیش رو"
          href="/admin/competitions"
          error={error}
          onRetry={() => void mutate()}
          isLoading={isLoading}
          isEmpty={(summary?.upcomingCompetitions.length ?? 0) === 0}
          empty={
            <EmptyState
              icon={TrophyIcon}
              title="هنوز مسابقه ای ثبت نشده است."
              action={
                <Button size="sm" render={<Link href="/admin/competitions/new" />}>
                  <PlusIcon data-icon="inline-start" />
                  مسابقه جدید
                </Button>
              }
            />
          }
        >
          {summary ? <AdminUpcomingList competitions={summary.upcomingCompetitions} /> : null}
        </HomeListSection>
      </div>
    </>
  );
}
