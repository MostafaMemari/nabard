"use client";

import { Avatar, MobileCardChips, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { studentPhotoUrl } from "../api";
import type { PendingReviewStudent } from "../types";
import { profileStatusKey } from "../types";

export function AdminReviewCard({ student }: { student: PendingReviewStudent }) {
  const hasPhoto = student.documents.some((document) => document.type === "PHOTO");

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <MobileCardTop
        leading={<Avatar id={student.id} name={student.fullName} size="md" src={hasPhoto ? studentPhotoUrl(student.id) : undefined} />}
        title={student.fullName}
        end={<StatusBadge status={profileStatusKey(student.profileStatus)} />}
      />
      <MobileCardLine label="مربی" value={student.coachName} />
      <MobileCardLine label="کد ملی" value={<span className="tabular-nums">{student.nationalCode}</span>} />
      <MobileCardChips>
        <span className="text-subtle text-muted-foreground">{`${toPersianDigits(student.documents.length)} از ۴ مدرک`}</span>
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(student.createdAt))}</span>
      </MobileCardChips>
    </div>
  );
}
