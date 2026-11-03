"use client";

import { Avatar, BeltChip, MobileCardChips, MobileCardLine, MobileCardLink, MobileCardTop } from "@/components/shared";
import type { Belt } from "@/features/base-data";
import { type Student, studentPhotoUrl } from "@/features/students";
import { formatJalaliDate } from "@/lib/format";

export function CoachStudentCard({ student, belts }: { student: Student; belts: Belt[] }) {
  const belt = belts.find((item) => item.id === student.beltId);

  return (
    <MobileCardLink href={`/admin/profiles/${student.id}`}>
      <MobileCardTop
        leading={
          <Avatar id={student.id} name={student.fullName} size="md" src={student.hasPhoto ? studentPhotoUrl(student.id) : undefined} />
        }
        title={student.fullName}
      />
      <MobileCardChips>{belt ? <BeltChip belt={belt} /> : null}</MobileCardChips>
      <MobileCardLine label="تاریخ تولد" value={formatJalaliDate(new Date(student.birthDate))} />
    </MobileCardLink>
  );
}
