"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { toPersianDigits } from "@/lib/format";
import { addDefaultCounties } from "../api";

export function CountyDefaultsDialog({ open, onDone, onClose }: { open: boolean; onDone: () => void; onClose: () => void }) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    setWorking(true);
    try {
      const { added } = await addDefaultCounties();
      toast.success(added === 0 ? "همه شهرستان های پیش فرض از قبل ثبت شده بودند." : `${toPersianDigits(added)} شهرستان پیش فرض اضافه شد.`);
      onDone();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "افزودن فهرست پیش فرض انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="افزودن فهرست پیش فرض"
      description="فهرست رسمی شهرستان های استان اضافه می شود. فقط شهرستان های تکراری نادیده گرفته می شوند و هیچ شهرستان موجودی تغییر نمی کند."
      confirmLabel="افزودن"
      loading={working}
      onConfirm={() => void confirm()}
    />
  );
}
