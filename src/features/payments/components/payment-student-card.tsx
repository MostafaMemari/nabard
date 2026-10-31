"use client";

import { Avatar, BeltChip, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import type { Registration } from "@/features/registrations";
import type { Student } from "@/features/students";
import { formatNumber } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { PaymentStudentActions } from "./payment-student-actions";

export function PaymentStudentCard({
  registration,
  students,
  actions,
}: {
  registration: Registration;
  students: Student[];
  actions: PaymentStudentActions;
}) {
  const { belts } = useBelts();
  const { canApprove, busyId, onApprove, onRejectOpen } = actions;
  const student = students.find((item) => item.id === registration.studentId);
  const belt = belts.find((item) => item.id === student?.beltId);
  const busy = busyId === registration.id;
  const name = student?.fullName ?? registration.studentId;

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Avatar id={registration.studentId} name={name} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <StatusBadge status={paymentBadgeStatus(registration.status)} />
      </div>
      <div className="flex items-center gap-2">
        {belt ? <BeltChip belt={belt} /> : null}
        {student?.weightKg != null ? (
          <span className="text-subtle text-muted-foreground tabular-nums">{formatNumber(student.weightKg)} کیلوگرم</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canApprove || registration.status === "APPROVED" || busy}
          onClick={() => void onApprove(registration)}
        >
          تأیید
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-danger"
          disabled={registration.status === "REJECTED" || busy}
          onClick={() => onRejectOpen(registration)}
        >
          رد
        </Button>
      </div>
    </div>
  );
}
