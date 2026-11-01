"use client";

import { TrophyIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DataTable, EmptyState, HomeListSection, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { CoachCompetitionList, useCompetitions } from "@/features/competitions";
import { usePayments } from "@/features/payments";
import { CoachRegistrationCard, coachRegistrationColumns } from "@/features/registrations";
import { CoachSummaryCards } from "./coach-summary-cards";
import { EmptyRegistrations as EmptyRegistrationsBlock } from "./empty-registrations";
import { useCoachRegistrationRows } from "./use-coach-registration-rows";

function isRegistrationOpen(deadline: string, now: Date): boolean {
  return new Date(deadline).getTime() >= now.getTime();
}

export function CoachHomeScreen({ coachId }: { coachId: string }) {
  const router = useRouter();
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
      <PageHeader title="خانه" description="مسابقات باز و آخرین ثبت نام ها." />

      <CoachSummaryCards
        openCompetitions={openCompetitions.length}
        registrationsCount={rows.length}
        awaitingReview={awaitingReview}
        isLoading={competitionsLoading || registrationsLoading || paymentsLoading}
      />

      <HomeListSection
        title="مسابقات باز"
        href="/coach/competitions"
        error={competitionsError}
        onRetry={() => void retryCompetitions()}
        isLoading={competitionsLoading}
        isEmpty={openCompetitions.length === 0}
        empty={
          <EmptyState
            icon={TrophyIcon}
            title="مسابقه بازی برای ثبت نام وجود ندارد."
            action={
              <Button size="sm" variant="outline" render={<Link href="/coach/competitions" />}>
                مشاهده همه مسابقات
              </Button>
            }
          />
        }
      >
        <CoachCompetitionList competitions={openCompetitions} />
      </HomeListSection>

      <HomeListSection
        title="ثبت نام های من"
        href="/coach/registrations"
        error={registrationsError}
        onRetry={() => void retryRegistrations()}
        isLoading={registrationsLoading}
        isEmpty={recentRows.length === 0}
        empty={<EmptyRegistrationsBlock />}
      >
        <DataTable
          columns={coachRegistrationColumns()}
          rows={recentRows}
          getRowId={(row) => row.registration.id}
          pageSize={5}
          onRowClick={(row) => router.push(`/coach/registrations/${row.registration.id}`)}
          renderCard={(row) => <CoachRegistrationCard row={row} />}
        />
      </HomeListSection>
    </>
  );
}
