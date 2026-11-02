"use client";

import { Avatar, StatusBadge } from "@/components/shared";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Registration } from "@/features/registrations";
import { formatJalaliDateTime } from "@/lib/format";

export type RegistrationRow = {
  registration: Registration;
  student?: { id: string; fullName: string };
  weightClassLabel: string | null;
};

export function registrationBadgeStatus(status: string) {
  if (status === "APPROVED") {
    return "APPROVED" as const;
  }
  if (status === "REJECTED") {
    return "REJECTED" as const;
  }
  return "PENDING_REVIEW" as const;
}

export function CompetitionRegistrationsRows({ rows }: { rows: RegistrationRow[] }) {
  return (
    <TableBody>
      {rows.map(({ registration, student, weightClassLabel }) => (
        <TableRow key={registration.id}>
          <TableCell>
            <StudentCell student={student} />
          </TableCell>
          <TableCell className="text-subtle whitespace-nowrap text-muted-foreground tabular-nums">{weightClassLabel ?? "-"}</TableCell>
          <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
            {formatJalaliDateTime(new Date(registration.createdAt))}
          </TableCell>
          <TableCell>
            <StatusBadge status={registrationBadgeStatus(registration.status)} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function StudentCell({ student }: { student?: { id: string; fullName: string } }) {
  if (!student) {
    return <span className="text-subtle text-muted-foreground">-</span>;
  }
  return (
    <div className="flex items-center gap-2.5">
      <Avatar id={student.id} name={student.fullName} size="sm" />
      <span className="text-sm font-medium">{student.fullName}</span>
    </div>
  );
}
