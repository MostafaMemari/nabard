"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, MobileCard, MobileCardLine, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/format";
import type { User } from "../types";
import { GenderChip } from "./gender-chip";

export function CoachCard({
  coach,
  studentCount,
  onToggleStatus,
}: {
  coach: User;
  studentCount: number;
  onToggleStatus: (coach: User) => void;
}) {
  return (
    <MobileCard className="gap-3">
      <Link
        href={`/admin/coaches/${coach.id}`}
        className="-mx-2 -mt-2 flex items-center gap-3 rounded-lg p-2 text-start transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Avatar id={coach.id} name={coach.fullName} size="md" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{coach.fullName}</span>
        <StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />
        <ChevronLeftIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </Link>
      <MobileCardLine label="شماره همراه" value={<span className="tabular-nums">{toPersianDigits(coach.mobile)}</span>} />
      <MobileCardLine label="جنسیت" value={<GenderChip gender={coach.gender} />} />
      <MobileCardLine label="شهرستان" value={coach.countyName ?? "نامشخص"} />
      <MobileCardLine label="هنرجویان" value={<span className="tabular-nums">{toPersianDigits(studentCount)} نفر</span>} />
      <div className="-mx-4 -mb-4 border-t border-border p-2">
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full justify-center text-muted-foreground hover:text-foreground"
          onClick={() => onToggleStatus(coach)}
        >
          {coach.isActive ? "غیرفعال سازی" : "فعال سازی"}
        </Button>
      </div>
    </MobileCard>
  );
}
