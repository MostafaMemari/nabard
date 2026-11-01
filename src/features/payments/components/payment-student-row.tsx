"use client";

import { Avatar, BeltChip, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useBelts } from "@/features/base-data";
import type { Registration } from "@/features/registrations";
import { formatNumber } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { PaymentStudentActions } from "./payment-student-actions";

export function PaymentStudentRow({ registration, actions }: { registration: Registration; actions: PaymentStudentActions }) {
  const { belts } = useBelts();
  const { canApprove, busyId, onApprove, onRejectOpen } = actions;
  const { student } = registration;
  const belt = belts.find((item) => item.id === student.beltId);
  const busy = busyId === registration.id;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar id={student.id} name={student.fullName} size="sm" />
          <span className="text-sm font-medium">{student.fullName}</span>
        </div>
      </TableCell>
      <TableCell>{belt ? <BeltChip belt={belt} /> : "-"}</TableCell>
      <TableCell className="text-subtle whitespace-nowrap text-muted-foreground tabular-nums">
        {student.weightKg != null ? `${formatNumber(student.weightKg)} کیلوگرم` : "-"}
      </TableCell>
      <TableCell>
        <StatusBadge status={paymentBadgeStatus(registration.status)} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
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
      </TableCell>
    </TableRow>
  );
}
