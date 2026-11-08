"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, MobileCardChips, MobileCardLine, StatusBadge } from "@/components/shared";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import type { PendingReviewStudent } from "../types";
import { profileStatusKey } from "../types";

export function AdminReviewCard({ student, href }: { student: PendingReviewStudent; href: string }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="p-4 pb-2.5">
        <Link
          href={href}
          className="flex w-full items-center gap-3 rounded-lg text-start transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Avatar id={student.id} name={student.fullName} size="md" src={student.photoUrl ?? undefined} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{student.fullName}</span>
          <StatusBadge status={profileStatusKey(student.profileStatus)} />
          <ChevronLeftIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        <MobileCardLine label="مربی" value={student.coachName} />
        <MobileCardLine label="کد ملی" value={<span className="tabular-nums">{student.nationalCode}</span>} />
        <MobileCardChips>
          <span className="text-subtle text-muted-foreground">{`${toPersianDigits(student.documents.length)} از ۴ مدرک`}</span>
          <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(student.createdAt))}</span>
        </MobileCardChips>
      </div>
    </div>
  );
}
