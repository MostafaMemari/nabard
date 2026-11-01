"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toPersianDigits } from "@/lib/format";
import { provinceLabels } from "@/lib/provinces";
import type { AdminUser } from "../types";

export function adminsColumns(options: {
  onToggleStatus: (admin: AdminUser) => void;
  onEdit: (admin: AdminUser) => void;
  onResetPassword: (admin: AdminUser) => void;
}): DataTableColumn<AdminUser>[] {
  return [
    {
      id: "name",
      header: "ادمین استان",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.id} name={row.fullName} size="sm" />
          <span className="font-medium">{row.fullName}</span>
        </div>
      ),
      sortValue: (row) => row.fullName,
    },
    { id: "mobile", header: "شماره همراه", cell: (row) => toPersianDigits(row.mobile) },
    { id: "province", header: "استان", cell: (row) => provinceLabels[row.province], sortValue: (row) => provinceLabels[row.province] },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} /> },
    {
      id: "actions",
      header: "عملیات",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${row.fullName}`} />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => options.onEdit(row)}>ویرایش</DropdownMenuItem>
            <DropdownMenuItem onClick={() => options.onResetPassword(row)}>بازنشانی رمز عبور</DropdownMenuItem>
            <DropdownMenuItem onClick={() => options.onToggleStatus(row)}>{row.isActive ? "غیرفعال سازی" : "فعال سازی"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
