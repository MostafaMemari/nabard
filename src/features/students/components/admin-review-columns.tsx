"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import type { RegistrationRequestDetail } from "../types";
import { registrationStatusKey } from "../types";

export function useAdminReviewColumns(): DataTableColumn<RegistrationRequestDetail>[] {
  return [
    {
      id: "student",
      header: "هنرجو",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.id} name={row.fullName} size="sm" src={row.photoUrl ?? undefined} />
          <span className="font-medium">{row.fullName}</span>
        </div>
      ),
      sortValue: (row) => row.fullName,
    },
    { id: "coach", header: "مربی", cell: (row) => row.coachName, sortValue: (row) => row.coachName },
    { id: "nationalCode", header: "کد ملی", cell: (row) => <span className="tabular-nums">{row.nationalCode}</span>, minScreen: "lg" },
    {
      id: "photo",
      header: "عکس پرسنلی",
      cell: (row) => <span className="text-subtle">{row.photoUrl ? "بارگذاری شده" : "بارگذاری نشده"}</span>,
      minScreen: "lg",
    },
    { id: "createdAt", header: "تاریخ", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "xl" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={registrationStatusKey(row.status)} /> },
  ];
}
