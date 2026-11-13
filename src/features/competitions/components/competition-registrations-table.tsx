"use client";

import { ClipboardListIcon } from "lucide-react";
import { DataTable, EmptyState, ErrorBanner, SkeletonRows } from "@/components/shared";
import type { Gender } from "@/features/base-data";
import { useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { toPersianDigits } from "@/lib/format";
import { CompetitionRegistrationCard } from "./competition-registration-card";
import { useRegistrationColumns } from "./competition-registrations-columns";
import type { RegistrationRow } from "./competition-registrations-rows";

export function CompetitionRegistrationsTable({
  competitionId,
  ageCategoryId,
  gender,
}: {
  competitionId: string;
  ageCategoryId: string;
  gender: Gender;
}) {
  const { registrations, isLoading, error, mutate } = useRegistrations({ competitionId });
  const { weightClasses } = useWeightClasses({ ageCategoryId, gender });

  const rows: RegistrationRow[] = registrations.map((registration) => {
    const weightClass = weightClasses.find((item) => item.id === registration.weightClassId);
    const label = registration.weightClassLabel ?? weightClass?.label ?? null;
    return {
      registration,
      student: registration.student,
      weightClassLabel: label ? `${toPersianDigits(label)} کیلوگرم` : null,
    };
  });

  const columns = useRegistrationColumns();

  if (error) {
    return <ErrorBanner message="دریافت ثبت نام ها ناموفق بود" onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return <SkeletonRows rows={3} className="h-12" />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={ClipboardListIcon} title="هنوز ثبت نامی برای این مسابقه انجام نشده است" />;
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.registration.id}
      renderCard={(row) => <CompetitionRegistrationCard row={row} />}
    />
  );
}
