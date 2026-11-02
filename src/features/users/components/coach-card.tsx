"use client";

import { Avatar, MobileCard, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
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
      <MobileCardTop
        leading={<Avatar id={coach.id} name={coach.fullName} size="md" />}
        title={coach.fullName}
        end={<StatusBadge status={coach.isActive ? "ACTIVE" : "INACTIVE"} />}
      />
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
