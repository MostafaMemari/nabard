"use client";

import { SectionCard } from "@/components/shared";
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
    <SectionCard
      title="ثبت نام ها"
      className="print:hidden"
      action={<span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} هنرجو</span>}
    >
      <CompetitionRegistrationsTable competitionId={competitionId} ageCategoryId={ageCategoryId} gender={gender} />
    </SectionCard>
  );
}
