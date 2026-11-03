"use client";

import { TrophyIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorBanner, SkeletonRows, StateCard, StatusBadge } from "@/components/shared";
import type { RegistrationStatus } from "@/features/registrations";
import { useRegistrations } from "@/features/registrations";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

function registrationBadgeStatus(status: RegistrationStatus): "PENDING_REVIEW" | "APPROVED" | "REJECTED" {
  return status === "PENDING" ? "PENDING_REVIEW" : status;
}

export function StudentRegistrationHistory({ studentId }: { studentId: string }) {
  const { registrations, isLoading, error, mutate } = useRegistrations({ studentId });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">تاریخچه ثبت نام مسابقات</h2>
        {registrations.length > 0 ? (
          <span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} ثبت نام</span>
        ) : null}
      </div>
      {error ? (
        <ErrorBanner onRetry={() => void mutate()} />
      ) : isLoading ? (
        <SkeletonRows rows={2} className="h-14" />
      ) : registrations.length === 0 ? (
        <StateCard>
          <EmptyState icon={TrophyIcon} title="این هنرجو تا کنون در مسابقه ای ثبت نام نشده است." />
        </StateCard>
      ) : (
        <div className="flex flex-col gap-2">
          {registrations.map((registration) => (
            <Link
              key={registration.id}
              href={`/coach/registrations/${registration.id}`}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-card transition-colors duration-150 hover:border-ring/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring/60"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{registration.competitionTitle}</span>
              {registration.weightClassLabel ? (
                <span className="text-subtle text-muted-foreground">رده {toPersianDigits(registration.weightClassLabel)}</span>
              ) : null}
              <span className="text-subtle text-muted-foreground tabular-nums">{formatJalaliDate(new Date(registration.createdAt))}</span>
              <StatusBadge status={registrationBadgeStatus(registration.status)} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
