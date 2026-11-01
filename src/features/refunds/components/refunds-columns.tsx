"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";
import { refundReasonLabels, refundStatusKey } from "../labels";
import type { Refund } from "../types";

export function useRefundColumns({ onComplete }: { onComplete: (refund: Refund) => void }): DataTableColumn<Refund>[] {
  return [
    {
      id: "coach",
      header: "مربی",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.coachId} name={row.coachName} size="sm" />
          <span className="font-medium">{row.coachName}</span>
        </div>
      ),
      sortValue: (row) => row.coachName,
    },
    { id: "student", header: "هنرجو", cell: (row) => row.studentName, sortValue: (row) => row.studentName },
    {
      id: "competition",
      header: "مسابقه",
      cell: (row) => row.competitionTitle,
      sortValue: (row) => row.competitionTitle,
      minScreen: "lg",
    },
    {
      id: "amount",
      header: "مبلغ",
      cell: (row) => <span className="tabular-nums">{formatRialsAsToman(Number(row.amount))}</span>,
      align: "end",
    },
    { id: "reason", header: "دلیل", cell: (row) => refundReasonLabels[row.reason], minScreen: "lg" },
    { id: "createdAt", header: "تاریخ", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "xl" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={refundStatusKey(row.status)} /> },
    {
      id: "actions",
      header: "",
      cell: (row) =>
        row.status === "PENDING" ? (
          <Button size="sm" variant="outline" onClick={() => onComplete(row)}>
            ثبت بازپرداخت
          </Button>
        ) : null,
    },
  ];
}
