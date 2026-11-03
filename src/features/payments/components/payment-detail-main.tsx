"use client";

import type { Registration } from "@/features/registrations";
import type { Student } from "@/features/students";
import type { Payment } from "../types";
import { PaymentReceiptCard } from "./payment-receipt-card";
import { PaymentStudentsSection } from "./payment-students-section";

export function PaymentDetailMain({
  payment,
  registrations,
  students,
  rowsLoading,
  busyId,
  onApprove,
  onReject,
}: {
  payment: Payment;
  registrations: Registration[];
  students: Student[];
  rowsLoading: boolean;
  busyId: string | null;
  onApprove: (registration: Registration) => Promise<void>;
  onReject: (registration: Registration) => Promise<void>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PaymentReceiptCard payment={payment} />
      <PaymentStudentsSection
        registrations={registrations}
        students={students}
        isLoading={rowsLoading}
        canApprove={payment.status === "CONFIRMED"}
        busyId={busyId}
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
