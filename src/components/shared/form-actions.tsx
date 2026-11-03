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
    <div className="flex items-center justify-end gap-3">
      <Button type="button" variant="ghost" render={<Link href={cancelHref} />}>
        انصراف
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  );
}
