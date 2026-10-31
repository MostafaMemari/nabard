"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import { type CoachRegistrationRow, paymentStatusKey, registrationStatusKey } from "./coach-registration-row";

export function coachRegistrationColumns(): DataTableColumn<CoachRegistrationRow>[] {
  return [
    {
      id: "student",
      header: "هنرجو",
      cell: (row) =>
        row.studentName ? (
          <div className="flex items-center gap-2.5">
            <Avatar id={row.registration.studentId} name={row.studentName} size="sm" />
            <span className="font-medium">{row.studentName}</span>
          </div>
        ) : (
          "—"
        ),
      sortValue: (row) => row.studentName ?? "",
    },
    { id: "competition", header: "مسابقه", cell: (row) => row.competitionTitle, sortValue: (row) => row.competitionTitle, minScreen: "lg" },
    {
      id: "weightClass",
      header: "رده وزنی",
      cell: (row) => <span className="whitespace-nowrap text-muted-foreground">{row.weightClassLabel ?? "—"}</span>,
      minScreen: "lg",
    },
    {
      id: "createdAt",
      header: "تاریخ ثبت‌نام",
      cell: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">{formatJalaliDate(new Date(row.registration.createdAt))}</span>
      ),
      sortValue: (row) => row.registration.createdAt,
      minScreen: "xl",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={registrationStatusKey(row.registration.status)} /> },
    {
      id: "payment",
      header: "رسید",
      cell: (row) =>
        row.paymentStatus ? <StatusBadge status={paymentStatusKey(row.paymentStatus)} /> : <span className="text-muted-foreground">—</span>,
    },
  ];
}
