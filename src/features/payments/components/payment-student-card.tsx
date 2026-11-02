"use client";

import { Avatar, BeltChip, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import type { Registration } from "@/features/registrations";
import { paymentBadgeStatus } from "../status";
import type { PaymentStudentActions } from "./payment-student-actions";

export function PaymentStudentCard({ registration, actions }: { registration: Registration; actions: PaymentStudentActions }) {
  const { belts } = useBelts();
  const { canApprove, busyId, onApprove, onRejectOpen } = actions;
  const { student } = registration;
  const belt = belts.find((item) => item.id === student.beltId);
  const busy = busyId === registration.id;

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Avatar id={student.id} name={student.fullName} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{student.fullName}</span>
        <StatusBadge status={paymentBadgeStatus(registration.status)} />
      </div>
      <div className="flex items-center gap-2">{belt ? <BeltChip belt={belt} /> : null}</div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-11 md:h-8"
          disabled={!canApprove || registration.status === "APPROVED" || busy}
          onClick={() => void onApprove(registration)}
        >
          تأیید
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-11 text-danger md:h-8"
          disabled={registration.status === "REJECTED" || busy}
          onClick={() => onRejectOpen(registration)}
        >
          رد
        </Button>
      </div>
    </div>
  );
}
