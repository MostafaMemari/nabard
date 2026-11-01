"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { updateCoachStatus } from "../api";
import type { User } from "../types";

export function CoachStatusDialog({
  coach,
  targetActive,
  onDone,
  onClose,
}: {
  coach: User | null;
  targetActive: boolean | null;
  onDone: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    if (!coach || targetActive === null) {
      return;
    }
    setWorking(true);
    try {
      await updateCoachStatus(coach.id, targetActive);
      toast.success(targetActive ? "مربی فعال شد." : "مربی غیرفعال شد.");
      await onDone();
      onClose();
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <ConfirmDialog
      open={coach !== null && targetActive !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={targetActive ? "فعال سازی مربی" : "غیرفعال کردن مربی"}
      description={
        targetActive
          ? `با فعال سازی، «${coach?.fullName}» می تواند دوباره وارد سامانه شود.`
          : `با غیرفعال کردن حساب، «${coach?.fullName}» دیگر نمی تواند وارد سامانه شود. اطلاعات هنرجویان او حفظ می شود.`
      }
      confirmLabel={targetActive ? "فعال سازی" : "غیرفعال کردن"}
      destructive={targetActive === false}
      loading={working}
      onConfirm={() => void confirm()}
    />
  );
}
