"use client";

import { PlusIcon, ReceiptTextIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, HomeListSection, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useSummary } from "@/features/summary";
import { AdminActionList } from "./admin-action-list";
import { AdminSummaryCards } from "./admin-summary-cards";
import { AdminUpcomingList } from "./admin-upcoming-list";

export function AdminHomeScreen() {
  const { summary, isLoading, error, mutate } = useSummary();

  return (
    <>
      <PageHeader title="خانه" description="رسیدهای در انتظار بررسی و مسابقات پیش رو." />

      <AdminSummaryCards summary={summary} isLoading={isLoading} />

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
