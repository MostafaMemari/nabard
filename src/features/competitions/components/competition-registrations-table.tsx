"use client";

import { Avatar, DataTable, type DataTableColumn, EmptyState, ErrorBanner, StatusBadge } from "@/components/shared";
import { SkeletonRows } from "@/components/shared/rows-skeleton";
import type { Gender } from "@/features/base-data";
import { useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";
import { CompetitionRegistrationCard } from "./competition-registration-card";
import { type RegistrationRow, registrationBadgeStatus } from "./competition-registrations-rows";

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
  const { students } = useStudents();
  const { weightClasses } = useWeightClasses({ ageCategoryId, gender });

  const rows: RegistrationRow[] = registrations.map((registration) => {
    const weightClass = weightClasses.find((item) => item.id === registration.weightClassId);
    return {
      registration,
      student: students.find((student) => student.id === registration.studentId),
      weightClassLabel: weightClass ? `${toPersianDigits(weightClass.label)} کیلوگرم` : null,
    };
  });

  const columns: DataTableColumn<RegistrationRow>[] = [
    {
      id: "student",
      header: "هنرجو",
      cell: (row) =>
        row.student ? (
          <div className="flex items-center gap-2.5">
            <Avatar id={row.student.id} name={row.student.fullName} size="sm" />
            <span className="font-medium">{row.student.fullName}</span>
          </div>
        ) : (
          <span className="text-subtle text-muted-foreground">-</span>
        ),
      sortValue: (row) => row.student?.fullName ?? "",
    },
    {
      id: "weightClass",
      header: "رده وزنی",
      cell: (row) => (
        <span className="text-subtle whitespace-nowrap text-muted-foreground tabular-nums">{row.weightClassLabel ?? "-"}</span>
      ),
      minScreen: "lg",
    },
    {
      id: "createdAt",
      header: "تاریخ ثبت نام",
      cell: (row) => (
        <span className="text-subtle whitespace-nowrap text-muted-foreground">
          {formatJalaliDateTime(new Date(row.registration.createdAt))}
        </span>
      ),
      sortValue: (row) => row.registration.createdAt,
      minScreen: "xl",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={registrationBadgeStatus(row.registration.status)} /> },
  ];

  if (error) {
    return <ErrorBanner message="دریافت ثبت نام ها ناموفق بود." onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return <SkeletonRows rows={3} className="h-12" />;
  }

  if (rows.length === 0) {
    return <EmptyState title="هنوز ثبت نامی برای این مسابقه انجام نشده است." />;
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
