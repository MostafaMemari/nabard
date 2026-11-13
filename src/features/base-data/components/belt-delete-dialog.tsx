"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { ApiError } from "@/lib/http";
import { type BeltAdmin, deleteBelt } from "../api-admin";

export function BeltDeleteDialog({ belt, onDone, onClose }: { belt: BeltAdmin | null; onDone: () => void; onClose: () => void }) {
  async function confirm() {
    if (!belt) {
      return;
    }
    try {
      await deleteBelt(belt.id);
      toast.success("کمربند حذف شد");
      onDone();
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "حذف انجام نشد. دوباره تلاش کنید");
      onClose();
    }
  }

  return (
    <ConfirmDialog
      open={belt !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="حذف کمربند"
      description={`کمربند «${belt?.label}» حذف می شود. اگر هنرجو یا مسابقه ای به آن متصل باشد، حذف انجام نمی شود و می توانید آن را بایگانی کنید`}
      confirmLabel="حذف"
      destructive
      onConfirm={() => void confirm()}
    />
  );
}
