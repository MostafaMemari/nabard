"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FormActions({
  cancelHref,
  submitLabel,
  submitting = false,
  submittingLabel = "در حال ذخیره…",
}: {
  cancelHref: string;
  submitLabel: string;
  submitting?: boolean;
  submittingLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-xl border border-border bg-card px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-card">
      <Button type="button" variant="ghost" render={<Link href={cancelHref} />}>
        انصراف
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  );
}
