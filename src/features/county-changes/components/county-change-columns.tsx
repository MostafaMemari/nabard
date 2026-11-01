"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { countyChangeStatusKey } from "../labels";
import type { CountyChangeRequest } from "../types";

export function useCountyChangeColumns({
  onDecide,
}: {
  onDecide: (request: CountyChangeRequest, decision: "approve" | "reject") => void;
}): DataTableColumn<CountyChangeRequest>[] {
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
    {
      id: "change",
      header: "تغییر شهرستان",
      cell: (row) => (
        <span className="whitespace-nowrap">
          {row.fromCountyName}
          <span aria-hidden className="mx-1.5 text-muted-foreground">
            →
          </span>
          {row.toCountyName}
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
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={countyChangeStatusKey(row.status)} /> },
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
              تایید
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
