"use client";

import { LandmarkIcon, type LucideIcon, MedalIcon, ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BeltDot, IconTile } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import type { StudentDetail } from "../types";

function dateValue(value: string | null): ReactNode {
  return value === null ? <span className="font-normal text-muted-foreground">ثبت نشده</span> : formatJalaliDate(new Date(value));
}

function FieldTile({ icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <IconTile icon={icon} size="sm" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

export function StudentFieldTiles({
  student,
  beltLabel,
  beltCode,
}: {
  student: StudentDetail;
  beltLabel: string | null;
  beltCode: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FieldTile icon={ShieldCheckIcon} label="تاریخ بیمه ورزشی" value={dateValue(student.insuranceDate)} />
      <FieldTile icon={LandmarkIcon} label="تاریخ شارژ بانک اطلاعات تکواندو" value={dateValue(student.tkdBankChargeDate)} />
      <FieldTile
        icon={MedalIcon}
        label="کمربند"
        value={
          beltLabel && beltCode ? (
            <span className="flex items-center gap-1.5">
              <BeltDot code={beltCode} />
              {beltLabel}
            </span>
          ) : (
            "نامشخص"
          )
        }
      />
    </div>
  );
}
