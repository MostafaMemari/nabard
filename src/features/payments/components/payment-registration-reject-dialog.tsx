"use client";

import { ConfirmDialog } from "@/components/shared";
import type { Registration } from "@/features/registrations";
import type { Student } from "@/features/students";

export function PaymentRegistrationRejectDialog({
  registration,
  students,
  loading,
  onClose,
  onConfirm,
}: {
  registration: Registration | null;
  students: Student[];
  loading: boolean;
  onClose: () => void;
  onConfirm: (registration: Registration) => void;
}) {
  const name = registration ? (students.find((student) => student.id === registration.studentId)?.fullName ?? registration.studentId) : "";

  return (
    <ConfirmDialog
      open={registration !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="رد ثبت نام"
      description={`ثبت نام «${name}» رد می شود و هنرجو در این مسابقه پذیرفته نخواهد شد.`}
      confirmLabel="رد ثبت نام"
      destructive
      loading={loading}
      onConfirm={() => {
        if (registration) {
          onConfirm(registration);
        }
      }}
    />
  );
}
