"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Avatar, BeltChip, type DataTableColumn } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Belt } from "@/features/base-data";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import type { Student } from "../types";

export function studentColumns(options: { belts: Belt[]; onDelete: (student: Student) => void }): DataTableColumn<Student>[] {
  const { belts, onDelete } = options;

  return [
    {
      id: "name",
      header: "هنرجو",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.id} name={row.fullName} size="sm" src={row.photoUrl ?? undefined} />
          <span className="font-medium">{row.fullName}</span>
        </div>
      ),
      sortValue: (row) => row.fullName,
    },
    { id: "nationalCode", header: "کد ملی", cell: (row) => toPersianDigits(row.nationalCode), sortValue: (row) => row.nationalCode },
    {
      id: "belt",
      header: "کمربند",
      cell: (row) => {
        const belt = belts.find((item) => item.id === row.beltId);
        return belt ? <BeltChip belt={belt} /> : "-";
      },
    },
    {
      id: "birthDate",
      header: "تاریخ تولد",
      cell: (row) => formatJalaliDate(new Date(row.birthDate)),
      sortValue: (row) => row.birthDate,
    },
    {
      id: "actions",
      header: "عملیات",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`عملیات ${row.fullName}`} onClick={(event) => event.stopPropagation()} />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              variant="destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(row);
              }}
            >
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
