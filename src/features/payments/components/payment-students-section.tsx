"use client";

import { useState } from "react";
import { SectionCard, SkeletonRows } from "@/components/shared";
import type { Registration } from "@/features/registrations";
import { toPersianDigits } from "@/lib/format";
import { PaymentRegistrationRejectDialog } from "./payment-registration-reject-dialog";
import type { PaymentStudentActions } from "./payment-student-actions";
import { PaymentStudentCard } from "./payment-student-card";
import { PaymentStudentsTable } from "./payment-students-table";

export function PaymentStudentsSection({
  registrations,
  isLoading,
  canApprove,
  busyId,
  onApprove,
  onReject,
}: {
  registrations: Registration[];
  isLoading: boolean;
  canApprove: boolean;
  busyId: string | null;
  onApprove: (registration: Registration) => Promise<void>;
  onReject: (registration: Registration, note: string) => Promise<void>;
}) {
  const [pendingReject, setPendingReject] = useState<Registration | null>(null);

  const actions: PaymentStudentActions = {
    canApprove,
    busyId,
    onApprove,
    onRejectOpen: setPendingReject,
  };

  return (
    <SectionCard
      title="هنرجویان ثبت نام شده"
      action={<span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} هنرجو</span>}
    >
      {!canApprove ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          تأیید ثبت نام ها پس از تأیید رسید فعال می شود؛ رد کردن هر ثبت نام همیشه امکان پذیر است.
        </p>
      ) : null}

      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : registrations.length === 0 ? (
        <p className="text-subtle text-muted-foreground">برای این رسید ثبت نامی وجود ندارد.</p>
      ) : (
        <>
          <div className="hidden md:block">
            <PaymentStudentsTable registrations={registrations} actions={actions} />
          </div>
          <div className="flex flex-col overflow-hidden rounded-lg border border-border md:hidden">
            {registrations.map((registration) => (
              <PaymentStudentCard key={registration.id} registration={registration} actions={actions} />
            ))}
          </div>
        </>
      )}

      <PaymentRegistrationRejectDialog
        registration={pendingReject}
        loading={busyId !== null}
        onClose={() => setPendingReject(null)}
        onConfirm={(registration, note) => {
          setPendingReject(null);
          void onReject(registration, note);
        }}
      />
    </SectionCard>
  );
}
