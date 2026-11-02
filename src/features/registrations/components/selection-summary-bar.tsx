"use client";

import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

export function SelectionSummaryBar({
  count,
  totalLabel,
  disabled,
  onContinue,
}: {
  count: number;
  totalLabel: string;
  disabled: boolean;
  onContinue: () => void;
}) {
  const summary = (
    <>
      <span className="text-sm font-medium">{count > 0 ? `${formatNumber(count)} هنرجو انتخاب شد` : "هنرجویی انتخاب نشده است"}</span>
      <span className="text-subtle text-muted-foreground">جمع هزینه: {totalLabel}</span>
    </>
  );
  const action = (
    <Button type="button" disabled={disabled} onClick={onContinue}>
      ادامه
      <ArrowLeftIcon data-icon="inline-end" />
    </Button>
  );

  return (
    <>
      <div className="sticky bottom-4 z-10 hidden items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-3 shadow-card @lg:flex">
        <div className="flex items-center gap-4">{summary}</div>
        {action}
      </div>
      <div
        className="fixed inset-x-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-overlay @lg:hidden"
        style={{ bottom: "calc(3rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex min-w-0 flex-col">{summary}</div>
        {action}
      </div>
      <div aria-hidden className="h-20 @lg:hidden" />
    </>
  );
}
