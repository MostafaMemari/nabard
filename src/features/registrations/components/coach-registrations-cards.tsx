"use client";

import { Avatar, StatusBadge } from "@/components/shared";
import { formatJalaliDate } from "@/lib/format";
import { type CoachRegistrationRow, paymentStatusKey, registrationStatusKey } from "./coach-registration-row";

export function CoachRegistrationCards({ rows }: { rows: CoachRegistrationRow[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {rows.map((row) => (
        <div key={row.registration.id} className="flex flex-col gap-2.5 border-b border-border px-4 py-3.5 last:border-b-0">
          <div className="flex items-center gap-3">
            {row.studentName ? <Avatar id={row.registration.studentId} name={row.studentName} size="md" /> : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.studentName ?? "—"}</p>
              <p className="text-subtle truncate text-muted-foreground">{row.competitionTitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={registrationStatusKey(row.registration.status)} />
            {row.paymentStatus ? <StatusBadge status={paymentStatusKey(row.paymentStatus)} /> : null}
            {row.weightClassLabel ? <span className="text-subtle text-muted-foreground">{row.weightClassLabel}</span> : null}
            <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(row.registration.createdAt))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
