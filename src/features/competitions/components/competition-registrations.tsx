"use client";

import { Avatar, EmptyState, StatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Gender } from "@/features/base-data";
import { useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { type Student, useStudents } from "@/features/students";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";

export function CompetitionRegistrations({
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

  const rows = registrations.map((registration) => ({
    registration,
    student: students.find((student) => student.id === registration.studentId),
    weightClass: weightClasses.find((weightClass) => weightClass.id === registration.weightClassId),
  }));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">ثبت‌نام‌ها</h2>
        <span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} هنرجو</span>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>دریافت ثبت‌نام‌ها ناموفق بود.</span>
          <button type="button" onClick={() => mutate()} className="font-medium text-primary hover:underline">
            تلاش دوباره
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {["r1", "r2", "r3"].map((id) => (
            <Skeleton key={id} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="هنوز ثبت‌نامی برای این مسابقه انجام نشده است." />
      ) : (
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
            <TableBody>
              {rows.map(({ registration, student, weightClass }) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    <StudentCell student={student} />
                  </TableCell>
                  <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                    {weightClass ? `${toPersianDigits(weightClass.label)} کیلوگرم` : "—"}
                  </TableCell>
                  <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                    {formatJalaliDateTime(new Date(registration.createdAt))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        registration.status === "APPROVED" ? "APPROVED" : registration.status === "REJECTED" ? "REJECTED" : "PENDING_REVIEW"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function StudentCell({ student }: { student: Student | undefined }) {
  if (!student) {
    return <span className="text-subtle text-muted-foreground">—</span>;
  }
  return (
    <div className="flex items-center gap-2.5">
      <Avatar id={student.id} name={student.fullName} size="sm" />
      <span className="text-sm font-medium">{student.fullName}</span>
    </div>
  );
}
