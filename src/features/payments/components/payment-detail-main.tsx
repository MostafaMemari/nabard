"use client";

import type { Registration } from "@/features/registrations";
import type { Payment } from "../types";
import { PaymentReceiptCard } from "./payment-receipt-card";
import { PaymentStudentsSection } from "./payment-students-section";

export function PaymentDetailMain({
  payment,
  registrations,
  rowsLoading,
  busyId,
  onApprove,
  onReject,
}: {
  payment: Payment;
  registrations: Registration[];
  rowsLoading: boolean;
  busyId: string | null;
  onApprove: (registration: Registration) => Promise<void>;
  onReject: (registration: Registration, note: string) => Promise<void>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PaymentReceiptCard payment={payment} />
      <PaymentStudentsSection
        registrations={registrations}
        isLoading={rowsLoading}
        canApprove={payment.status === "CONFIRMED"}
        busyId={busyId}
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
