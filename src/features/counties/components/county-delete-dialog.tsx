"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared";
import { deleteCounty } from "../api";
import type { County } from "../types";

export function CountyDeleteDialog({ county, onDone, onClose }: { county: County | null; onDone: () => void; onClose: () => void }) {
  const [working, setWorking] = useState(false);

  async function confirm() {
    if (!county) {
      return;
    }
    setWorking(true);
    try {
      await deleteCounty(county.id);
      toast.success("شهرستان حذف شد.");
      onDone();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حذف انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <ConfirmDialog
      open={county !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="حذف شهرستان"
      description={`شهرستان «${county?.name}» حذف می شود. اگر مربی یا مسابقه ای به آن متصل باشد، حذف انجام نمی شود.`}
      confirmLabel="حذف"
      destructive
      loading={working}
      onConfirm={() => void confirm()}
    />
  );
}
