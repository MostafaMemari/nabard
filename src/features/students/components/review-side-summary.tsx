"use client";

import { BeltChip, DescriptionList, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Belt } from "@/features/base-data";
import { formatJalaliDate } from "@/lib/format";
import type { StudentDetail } from "../types";
import { profileStatusKey } from "../types";

export function ReviewSideSummary({
  student,
  belt,
  working,
  onApprove,
  onReject,
}: {
  student: StudentDetail;
  belt: Belt | null;
  working: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold">پروفایل هنرجو</span>
        <StatusBadge status={profileStatusKey(student.profileStatus)} />
      </div>

      {student.profileStatus === "REJECTED" && student.profileNote ? (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{student.profileNote}</p>
      ) : null}

      <DescriptionList
        items={[
          { term: "مربی", value: student.coachName },
          { term: "کد ملی", value: <span className="tabular-nums">{student.nationalCode}</span> },
          { term: "تاریخ تولد", value: formatJalaliDate(new Date(student.birthDate)) },
          {
            term: "تاریخ بیمه ورزشی",
            value: student.insuranceDate !== null ? formatJalaliDate(new Date(student.insuranceDate)) : "ثبت نشده",
          },
          {
            term: "تاریخ شارژ بانک اطلاعات تکواندو",
            value: student.tkdBankChargeDate !== null ? formatJalaliDate(new Date(student.tkdBankChargeDate)) : "ثبت نشده",
          },
          { term: "کمربند", value: belt ? <BeltChip belt={belt} /> : "نامشخص" },
          { term: "تاریخ ثبت", value: formatJalaliDate(new Date(student.createdAt)) },
        ]}
      />

      {student.profileStatus !== "APPROVED" ? (
        <div className="flex flex-col gap-2">
          <Button onClick={onApprove} disabled={working}>
            تأیید پروفایل
          </Button>
          <Button variant="outline" className="text-danger" onClick={onReject} disabled={working}>
            رد پروفایل
          </Button>
        </div>
      ) : (
        <p className="text-subtle text-muted-foreground">
          {student.approvedAt ? `در تاریخ ${formatJalaliDate(new Date(student.approvedAt))} تأیید شده است.` : "تأیید شده است."}
        </p>
      )}
    </div>
  );
}
