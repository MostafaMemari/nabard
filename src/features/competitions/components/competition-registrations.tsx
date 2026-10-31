"use client";

import type { Gender } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { toPersianDigits } from "@/lib/format";
import { CompetitionRegistrationsTable } from "./competition-registrations-table";

export function CompetitionRegistrations({
  competitionId,
  ageCategoryId,
  gender,
}: {
  competitionId: string;
  ageCategoryId: string;
  gender: Gender;
}) {
  const { registrations } = useRegistrations({ competitionId });

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">ثبت‌نام‌ها</h2>
        <span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} هنرجو</span>
      </div>
      <CompetitionRegistrationsTable competitionId={competitionId} ageCategoryId={ageCategoryId} gender={gender} />
    </section>
  );
}
