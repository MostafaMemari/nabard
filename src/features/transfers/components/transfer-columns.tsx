"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { transferStatusKey } from "../labels";
import type { TransferRequest } from "../types";

export function useTransferColumns({
  onDecide,
}: {
  onDecide: (request: TransferRequest, decision: "approve" | "reject") => void;
}): DataTableColumn<TransferRequest>[] {
  return [
    {
      id: "student",
      header: "هنرجو",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.studentId} name={row.studentName} size="sm" />
          <span className="font-medium">{row.studentName}</span>
        </div>
      ),
      sortValue: (row) => row.studentName,
    },
    {
      id: "coaches",
      header: "انتقال",
      cell: (row) => (
        <span className="whitespace-nowrap">
          {row.fromCoachName}
          <span aria-hidden className="mx-1.5 text-muted-foreground">
            →
          </span>
          {row.toCoachName}
        </span>
      ),
    },
    {
      id: "note",
      header: "توضیح",
      cell: (row) =>
        row.note ? (
          <span className="block max-w-56 truncate text-muted-foreground" title={row.note}>
            {row.note}
          </span>
        ) : null,
      minScreen: "xl",
    },
    { id: "createdAt", header: "تاریخ درخواست", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "lg" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={transferStatusKey(row.status)} /> },
    {
      id: "actions",
      header: "عملیات",
      cell: (row) =>
        row.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-success hover:text-success"
              onClick={(event) => {
                event.stopPropagation();
                onDecide(row, "approve");
              }}
            >
              تأیید
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-danger hover:text-danger"
              onClick={(event) => {
                event.stopPropagation();
                onDecide(row, "reject");
              }}
            >
              رد
            </Button>
          </div>
        ) : null,
    },
  ];
}
