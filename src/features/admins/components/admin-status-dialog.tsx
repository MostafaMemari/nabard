"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { updateAdmin } from "../api";
import type { AdminUser } from "../types";

export function AdminStatusDialog({
  admin,
  targetActive,
  onDone,
  onClose,
}: {
  admin: AdminUser | null;
  targetActive: boolean | null;
  onDone: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    if (!admin || targetActive === null) {
      return;
    }
    setWorking(true);
    try {
      await updateAdmin(admin.id, { isActive: targetActive });
      toast.success(targetActive ? "ادمین استان فعال شد" : "ادمین استان غیرفعال شد");
      await onDone();
      onClose();
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید");
    } finally {
      setWorking(false);
    }
  }

  return (
    <ConfirmDialog
      open={admin !== null && targetActive !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={targetActive ? "فعال سازی ادمین استان" : "غیرفعال کردن ادمین استان"}
      description={
        targetActive
          ? `با فعال سازی، «${admin?.fullName}» می تواند دوباره وارد سامانه شود`
          : `با غیرفعال کردن حساب، «${admin?.fullName}» دیگر نمی تواند وارد سامانه شود و به مسابقات استان خود دسترسی نخواهد داشت`
      }
      confirmLabel={targetActive ? "فعال سازی" : "غیرفعال کردن"}
      destructive={targetActive === false}
      loading={working}
      onConfirm={() => void confirm()}
    />
  );
}
