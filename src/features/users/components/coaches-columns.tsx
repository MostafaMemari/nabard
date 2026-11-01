"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Student } from "@/features/students";
import { toPersianDigits } from "@/lib/format";
import type { User } from "../types";

export function coachColumns(options: { students: Student[]; onToggleStatus: (coach: User) => void }): DataTableColumn<User>[] {
  const { students, onToggleStatus } = options;

  return [
    {
      id: "name",
      header: "مربی",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.id} name={row.fullName} size="sm" />
          <span className="font-medium">{row.fullName}</span>
        </div>
      ),
      sortValue: (row) => row.fullName,
    },
    { id: "mobile", header: "شماره همراه", cell: (row) => toPersianDigits(row.mobile) },
    { id: "county", header: "شهرستان", cell: (row) => row.countyName ?? "نامشخص", minScreen: "lg" },
    {
      id: "students",
      header: "هنرجویان",
      cell: (row) => toPersianDigits(students.filter((student) => student.coachId === row.id).length),
      align: "end",
      minScreen: "lg",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} /> },
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
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus(row);
              }}
            >
              {row.isActive ? "غیرفعال سازی" : "فعال سازی"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
