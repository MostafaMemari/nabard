"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { deleteStudent } from "../api";
import type { Student } from "../types";

export function StudentDeleteDialog({
  student,
  onDone,
  onClose,
}: {
  student: Student | null;
  onDone: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    if (!student) {
      return;
    }
    setWorking(true);
    try {
      await deleteStudent(student.id);
      toast.success("هنرجو حذف شد");
      await onDone();
      onClose();
    } catch {
      toast.error("حذف انجام نشد. دوباره تلاش کنید");
    } finally {
      setWorking(false);
    }
  }

  return (
    <ConfirmDialog
      open={student !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="حذف هنرجو"
      description={`«${student?.fullName}» از فهرست هنرجویان شما حذف می شود و در ثبت نام های بعدی قابل انتخاب نیست. این کار قابل بازگشت نیست`}
      confirmLabel="حذف"
      destructive
      loading={working}
      onConfirm={() => void confirm()}
    />
  );
}
