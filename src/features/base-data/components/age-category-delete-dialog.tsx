"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { ApiError } from "@/lib/http";
import { type AgeCategoryAdmin, deleteAgeCategory } from "../api-admin";

export function AgeCategoryDeleteDialog({
  category,
  onDone,
  onClose,
}: {
  category: AgeCategoryAdmin | null;
  onDone: () => void;
  onClose: () => void;
}) {
  async function confirm() {
    if (!category) {
      return;
    }
    try {
      await deleteAgeCategory(category.id);
      toast.success("رده سنی حذف شد.");
      onDone();
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "حذف انجام نشد. دوباره تلاش کنید.");
      onClose();
    }
  }

  return (
    <ConfirmDialog
      open={category !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="حذف رده سنی"
      description={`رده سنی «${category?.label}» با همه رده های وزنی آن حذف می شود. اگر مسابقه یا ثبت نامی به آن متصل باشد، حذف انجام نمی شود و می توانید آن را بایگانی کنید.`}
      confirmLabel="حذف"
      destructive
      onConfirm={() => void confirm()}
    />
  );
}
