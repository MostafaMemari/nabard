"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { formatJalaliDate, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { Payment } from "../types";
import { usePaymentMeta } from "./use-payment-meta";

export function usePaymentColumns(): DataTableColumn<Payment>[] {
  const { coachName, competitionTitle, studentCount } = usePaymentMeta();

  return [
    {
      id: "coach",
      header: "مربی",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.coachId} name={coachName(row.coachId)} size="sm" />
          <span className="font-medium">{coachName(row.coachId)}</span>
        </div>
      ),
      sortValue: (row) => coachName(row.coachId),
    },
    {
      id: "competition",
      header: "مسابقه",
      cell: (row) => competitionTitle(row.competitionId),
      sortValue: (row) => competitionTitle(row.competitionId),
      minScreen: "lg",
    },
    {
      id: "students",
      header: "هنرجویان",
      cell: (row) => toPersianDigits(studentCount(row.id)),
      align: "end",
      minScreen: "lg",
    },
    {
      id: "amount",
      header: "مبلغ",
      cell: (row) => <span className="tabular-nums">{formatRialsAsToman(Number(row.amount))}</span>,
      align: "end",
    },
    { id: "date", header: "تاریخ", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "lg" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={paymentBadgeStatus(row.status)} /> },
  ];
}
