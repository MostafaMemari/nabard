"use client";

import { Avatar, MobileCardChips, MobileCardLine, MobileCardLink, MobileCardTop, StatusBadge } from "@/components/shared";
import { refundStatusKey } from "@/features/refunds";
import { formatJalaliDate } from "@/lib/format";
import { type CoachRegistrationRow, paymentStatusKey, registrationStatusKey } from "./coach-registration-row";

export function CoachRegistrationCard({ row }: { row: CoachRegistrationRow }) {
  return (
    <MobileCardLink href={`/coach/registrations/${row.registration.id}`}>
      <MobileCardTop
        leading={row.studentName ? <Avatar id={row.registration.studentId} name={row.studentName} size="md" /> : undefined}
        title={row.studentName ?? "-"}
        end={<StatusBadge status={registrationStatusKey(row.registration.status)} />}
      />
      <MobileCardLine label="مسابقه" value={row.competitionTitle} />
      {row.weightClassLabel ? <MobileCardLine label="رده وزنی" value={row.weightClassLabel} /> : null}
      <MobileCardChips>
        {row.paymentStatus ? <StatusBadge status={paymentStatusKey(row.paymentStatus)} /> : null}
        {row.refundStatus ? <StatusBadge status={refundStatusKey(row.refundStatus)} /> : null}
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(row.registration.createdAt))}</span>
      </MobileCardChips>
    </MobileCardLink>
  );
}
