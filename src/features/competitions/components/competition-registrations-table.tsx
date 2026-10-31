"use client";

import { EmptyState, ErrorBanner } from "@/components/shared";
import { SkeletonRows } from "@/components/shared/rows-skeleton";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Gender } from "@/features/base-data";
import { useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";
import { toPersianDigits } from "@/lib/format";
import { CompetitionRegistrationsRows, type RegistrationRow } from "./competition-registrations-rows";

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

  if (error) {
    return <ErrorBanner message="دریافت ثبت‌نام‌ها ناموفق بود." onRetry={() => mutate()} />;
  }

  if (isLoading) {
    return <SkeletonRows rows={3} className="h-12" />;
  }

  if (rows.length === 0) {
    return <EmptyState title="هنوز ثبت‌نامی برای این مسابقه انجام نشده است." />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>هنرجو</TableHead>
            <TableHead>رده وزنی</TableHead>
            <TableHead>تاریخ ثبت‌نام</TableHead>
            <TableHead>وضعیت</TableHead>
          </TableRow>
        </TableHeader>
        <CompetitionRegistrationsRows rows={rows} />
      </Table>
    </div>
  );
}
