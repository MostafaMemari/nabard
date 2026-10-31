"use client";

import { Avatar, BeltChip, MobileCard, MobileCardChips, MobileCardLine, MobileCardTop } from "@/components/shared";
import type { Belt } from "@/features/base-data";
import type { Student } from "@/features/students";
import { formatJalaliDate, formatNumber } from "@/lib/format";

export function CoachStudentCard({ student, belts }: { student: Student; belts: Belt[] }) {
  const belt = belts.find((item) => item.id === student.beltId);

  return (
    <MobileCard>
      <MobileCardTop leading={<Avatar id={student.id} name={student.fullName} size="md" />} title={student.fullName} />
      <MobileCardChips>{belt ? <BeltChip belt={belt} /> : null}</MobileCardChips>
      <MobileCardLine
        label="وزن"
        value={<span className="tabular-nums">{student.weightKg !== null ? `${formatNumber(student.weightKg)} کیلوگرم` : "—"}</span>}
      />
      <MobileCardLine label="تاریخ تولد" value={formatJalaliDate(new Date(student.birthDate))} />
    </MobileCard>
  );
}
