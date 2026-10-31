"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DataTable, EmptyState, PageHeader, SummaryCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachCompetitionList, useCompetitions } from "@/features/competitions";
import { usePayments } from "@/features/payments";
import { CoachRegistrationCards, coachRegistrationColumns } from "@/features/registrations";
import { formatNumber } from "@/lib/format";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

function isRegistrationOpen(deadline: string, now: Date): boolean {
  return new Date(deadline).getTime() >= now.getTime();
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <Link href={href} className="text-subtle font-medium text-primary underline-offset-4 hover:underline">
        مشاهده همه
      </Link>
    </div>
  );
}

export function CoachHomeScreen({ coachId }: { coachId: string }) {
  const {
    competitions,
    isLoading: competitionsLoading,
    error: competitionsError,
    mutate: retryCompetitions,
  } = useCompetitions({ status: "PUBLISHED" });
  const {
    rows,
    isLoading: registrationsLoading,
    error: registrationsError,
    mutate: retryRegistrations,
  } = useCoachRegistrationRows(coachId);
  const { payments, isLoading: paymentsLoading } = usePayments({ coachId });

  const openCompetitions = useMemo(
    () => competitions.filter((competition) => isRegistrationOpen(competition.registrationDeadline, new Date())),
    [competitions],
  );
  const awaitingReview = payments.filter((payment) => payment.status === "PENDING").length;
  const recentRows = rows.slice(0, 5);

  return (
    <>
      <PageHeader title="خانه" description="نمای کلی مسابقات باز و ثبت‌نام‌های من." />

      <div className="grid gap-4 sm:grid-cols-3">
        {competitionsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <SummaryCard
            value={formatNumber(openCompetitions.length)}
            label="مسابقات باز"
            href="/coach/competitions"
            linkLabel="مشاهده مسابقات"
          />
        )}
        {registrationsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <SummaryCard value={formatNumber(rows.length)} label="ثبت‌نام‌های من" href="/coach/registrations" linkLabel="مشاهده ثبت‌نام‌ها" />
        )}
        {paymentsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <SummaryCard value={formatNumber(awaitingReview)} label="پرداخت‌های در انتظار بررسی" />
        )}
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeader title="مسابقات باز" href="/coach/competitions" />
        {competitionsError ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            <span>دریافت اطلاعات ناموفق بود.</span>
            <button type="button" onClick={() => void retryCompetitions()} className="font-medium hover:underline">
              تلاش دوباره
            </button>
          </div>
        ) : competitionsLoading ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            {["c1", "c2", "c3"].map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : openCompetitions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-card">
            <EmptyState title="هم‌اکنون مسابقه بازی برای ثبت‌نام وجود ندارد." />
          </div>
        ) : (
          <CoachCompetitionList competitions={openCompetitions} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="ثبت‌نام‌های من" href="/coach/registrations" />
        {registrationsError ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
            <span>دریافت اطلاعات ناموفق بود.</span>
            <button type="button" onClick={() => void retryRegistrations()} className="font-medium hover:underline">
              تلاش دوباره
            </button>
          </div>
        ) : registrationsLoading ? (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            {["r1", "r2", "r3"].map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : recentRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-card">
            <EmptyState
              title="هنوز ثبت‌نامی انجام نشده است."
              action={
                <Button size="sm" render={<Link href="/coach/competitions" />}>
                  مشاهده مسابقات باز
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden @lg:block">
              <DataTable columns={coachRegistrationColumns()} rows={recentRows} getRowId={(row) => row.registration.id} pageSize={5} />
            </div>
            <div className="@lg:hidden">
              <CoachRegistrationCards rows={recentRows} />
            </div>
          </>
        )}
      </section>
    </>
  );
}
