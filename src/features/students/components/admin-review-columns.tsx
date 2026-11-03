"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { studentPhotoUrl } from "../api";
import type { PendingReviewStudent } from "../types";
import { profileStatusKey } from "../types";

export function useAdminReviewColumns(): DataTableColumn<PendingReviewStudent>[] {
  return [
    {
      id: "student",
      header: "هنرجو",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            id={row.id}
            name={row.fullName}
            size="sm"
            src={row.documents.some((document) => document.type === "PHOTO") ? studentPhotoUrl(row.id) : undefined}
          />
          <span className="font-medium">{row.fullName}</span>
        </div>
      ),
      sortValue: (row) => row.fullName,
    },
    { id: "coach", header: "مربی", cell: (row) => row.coachName, sortValue: (row) => row.coachName },
    { id: "nationalCode", header: "کد ملی", cell: (row) => <span className="tabular-nums">{row.nationalCode}</span>, minScreen: "lg" },
    {
      id: "documents",
      header: "مدارک",
      cell: (row) => <span className="tabular-nums">{`${toPersianDigits(row.documents.length)} از ۴`}</span>,
      minScreen: "lg",
    },
    { id: "createdAt", header: "تاریخ", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "xl" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={profileStatusKey(row.profileStatus)} /> },
  ];
}
