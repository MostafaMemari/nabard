"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { formatJalaliDateTime } from "@/lib/format";
import { type RegistrationRow, registrationBadgeStatus } from "./competition-registrations-rows";

export function useRegistrationColumns(): DataTableColumn<RegistrationRow>[] {
  return [
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
}
