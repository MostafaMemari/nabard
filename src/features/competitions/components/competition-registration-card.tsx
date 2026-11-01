"use client";

import { Avatar, MobileCard, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import type { Registration } from "@/features/registrations/types";
import { formatJalaliDateTime } from "@/lib/format";
import { registrationBadgeStatus } from "./competition-registrations-rows";

export type CompetitionRegistrationCardRow = {
  registration: Registration;
  student?: { id: string; fullName: string };
  weightClassLabel: string | null;
};

export function CompetitionRegistrationCard({ row }: { row: CompetitionRegistrationCardRow }) {
  const { registration, student, weightClassLabel } = row;

  return (
    <MobileCard>
      <MobileCardTop
        leading={student ? <Avatar id={student.id} name={student.fullName} size="md" /> : undefined}
        title={student?.fullName ?? "-"}
        end={<StatusBadge status={registrationBadgeStatus(registration.status)} />}
      />
      <MobileCardLine label="رده وزنی" value={weightClassLabel ?? "-"} />
      <MobileCardLine label="تاریخ ثبت نام" value={formatJalaliDateTime(new Date(registration.createdAt))} />
    </MobileCard>
  );
}
