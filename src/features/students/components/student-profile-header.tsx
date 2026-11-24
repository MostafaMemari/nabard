"use client";

import { LockIcon, UserIcon } from "lucide-react";
import { SectionCard, StatusBadge } from "@/components/shared";
import { personGenderLabels } from "@/features/base-data";
import { formatJalaliDate } from "@/lib/format";
import { profileStatusKey, type StudentDetail } from "../types";

export function StudentProfileHeader({ student }: { student: StudentDetail }) {
  const photoUrl = student.photoUrl;

  return (
    <SectionCard>
      <div className="flex items-center gap-4">
        {photoUrl ? (
          // biome-ignore lint/performance/noImgElement: photo loads straight from R2 storage
          <img src={photoUrl} alt={student.fullName} className="size-16 shrink-0 rounded-full bg-muted object-cover" />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <UserIcon aria-hidden className="size-7" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{student.fullName}</h2>
            <StatusBadge status={profileStatusKey(student.profileStatus)} />
          </div>
          <p className="text-sm text-muted-foreground">
            {personGenderLabels[student.gender]} · متولد {formatJalaliDate(new Date(student.birthDate))} · کد ملی{" "}
            <span className="tabular-nums">{student.nationalCode}</span> · تاریخ ثبت {formatJalaliDate(new Date(student.createdAt))}
          </p>
        </div>
      </div>

      {student.profileStatus === "REJECTED" && student.profileNote ? (
        <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{student.profileNote}</p>
      ) : null}

      <p className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-subtle px-3 py-2.5 text-subtle text-primary">
        <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        اطلاعات این پروفایل پس از ثبت قابل ویرایش نیست؛ کمربند را ادمین استان ثبت می کند
      </p>
    </SectionCard>
  );
}
