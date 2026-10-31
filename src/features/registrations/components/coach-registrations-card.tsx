"use client";

import { Avatar, MobileCard, MobileCardChips, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import { type CoachRegistrationRow, paymentStatusKey, registrationStatusKey } from "./coach-registration-row";

export function CoachRegistrationCard({ row }: { row: CoachRegistrationRow }) {
  return (
    <MobileCard>
      <MobileCardTop
        leading={row.studentName ? <Avatar id={row.registration.studentId} name={row.studentName} size="md" /> : undefined}
        title={row.studentName ?? "—"}
        end={<StatusBadge status={registrationStatusKey(row.registration.status)} />}
      />
      <MobileCardLine label="مسابقه" value={row.competitionTitle} />
      {row.weightClassLabel ? <MobileCardLine label="رده وزنی" value={row.weightClassLabel} /> : null}
      <MobileCardChips>
        {row.paymentStatus ? <StatusBadge status={paymentStatusKey(row.paymentStatus)} /> : null}
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(row.registration.createdAt))}</span>
      </MobileCardChips>
    </MobileCard>
  );
}
