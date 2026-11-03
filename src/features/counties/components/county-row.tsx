"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { County } from "../types";

export function CountyRow({
  county,
  onEdit,
  onDelete,
}: {
  county: County;
  onEdit: (county: County) => void;
  onDelete: (county: County) => void;
}) {
  return (
    <div className="flex h-13 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-sm">{county.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${county.name}`} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onEdit(county)}>ویرایش</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(county)}>حذف</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
