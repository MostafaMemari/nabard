"use client";

import { TrophyIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, EmptyState, HomeListSection, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { CoachCompetitionList } from "@/features/competitions";
import { CoachRegistrationCard, coachRegistrationColumns } from "@/features/registrations";
import { CoachSummaryCards } from "./coach-summary-cards";
import { EmptyRegistrations as EmptyRegistrationsBlock } from "./empty-registrations";
import { useCoachHomeData } from "./use-coach-home-data";

export function CoachHomeScreen() {
  const router = useRouter();
  const {
    openCompetitions,
    recentRows,
    registrationsCount,
    awaitingReview,
    isLoading,
    competitionsLoading,
    competitionsError,
    retryCompetitions,
    registrationsLoading,
    registrationsError,
    retryRegistrations,
  } = useCoachHomeData();

  return (
    <>
      <PageHeader title="خانه" description="مسابقات باز و آخرین ثبت نام ها." />

      <CoachSummaryCards
        openCompetitions={openCompetitions.length}
        registrationsCount={registrationsCount}
        awaitingReview={awaitingReview}
        isLoading={isLoading}
      />

      <HomeListSection
        title="مسابقات باز"
        href="/coach/competitions"
        error={competitionsError}
        onRetry={retryCompetitions}
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
        onRetry={retryRegistrations}
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
