"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { provinceLabels } from "@/lib/provinces";
import { provinceChangeStatusKey } from "../labels";
import type { ProvinceChangeRequest } from "../types";

export function ProvinceChangeRoute({ request }: { request: ProvinceChangeRequest }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5">
      <span>{provinceLabels[request.fromProvince]}</span>
      <span aria-hidden className="text-muted-foreground">
        →
      </span>
      <span className="font-medium">{provinceLabels[request.toProvince]}</span>
    </span>
  );
}

export function useProvinceChangeColumns({
  onDecide,
}: {
  onDecide: (request: ProvinceChangeRequest, decision: "approve" | "reject") => void;
}): DataTableColumn<ProvinceChangeRequest>[] {
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
      id: "from",
      header: "مربی فعلی",
      cell: (row) => <span className="whitespace-nowrap">{row.fromCoachName}</span>,
    },
    {
      id: "route",
      header: "مسیر",
      cell: (row) => <ProvinceChangeRoute request={row} />,
    },
    {
      id: "toCoach",
      header: "مربی مقصد",
      cell: (row) => <span className="whitespace-nowrap">{row.toCoachName}</span>,
    },
    { id: "createdAt", header: "تاریخ درخواست", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "lg" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={provinceChangeStatusKey(row.status)} /> },
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
