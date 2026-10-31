"use client";

import { useState } from "react";
import { SkeletonRows } from "@/components/shared/rows-skeleton";
import type { Registration } from "@/features/registrations";
import type { Student } from "@/features/students";
import { toPersianDigits } from "@/lib/format";
import { PaymentRegistrationRejectDialog } from "./payment-registration-reject-dialog";
import type { PaymentStudentActions } from "./payment-student-actions";
import { PaymentStudentCard } from "./payment-student-card";
import { PaymentStudentsTable } from "./payment-students-table";

export function PaymentStudentsSection({
  registrations,
  students,
  isLoading,
  canApprove,
  busyId,
  onApprove,
  onReject,
}: {
  registrations: Registration[];
  students: Student[];
  isLoading: boolean;
  canApprove: boolean;
  busyId: string | null;
  onApprove: (registration: Registration) => Promise<void>;
  onReject: (registration: Registration) => Promise<void>;
}) {
  const [pendingReject, setPendingReject] = useState<Registration | null>(null);

  const actions: PaymentStudentActions = {
    canApprove,
    busyId,
    onApprove,
    onRejectOpen: setPendingReject,
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">هنرجویان ثبت‌نام‌شده</h2>
        <span className="text-subtle text-muted-foreground">{toPersianDigits(registrations.length)} هنرجو</span>
      </div>

      {!canApprove ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          تأیید ثبت‌نام‌ها پس از تأیید رسید فعال می‌شود؛ رد کردن هر ثبت‌نام همیشه امکان‌پذیر است.
        </p>
      ) : null}

      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : registrations.length === 0 ? (
        <p className="text-subtle text-muted-foreground">برای این رسید ثبت‌نامی وجود ندارد.</p>
      ) : (
        <>
          <div className="hidden md:block">
            <PaymentStudentsTable registrations={registrations} students={students} actions={actions} />
          </div>
          <div className="flex flex-col overflow-hidden rounded-lg border border-border md:hidden">
            {registrations.map((registration) => (
              <PaymentStudentCard key={registration.id} registration={registration} students={students} actions={actions} />
            ))}
          </div>
        </>
      )}

      <PaymentRegistrationRejectDialog
        registration={pendingReject}
        students={students}
        loading={busyId !== null}
        onClose={() => setPendingReject(null)}
        onConfirm={(registration) => void onReject(registration).finally(() => setPendingReject(null))}
      />
    </section>
  );
}
