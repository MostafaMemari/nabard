"use client";

import { MobileCardChips, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";
import { refundReasonLabels, refundStatusKey } from "../labels";
import type { Refund } from "../types";

export function RefundCard({ refund, onComplete }: { refund: Refund; onComplete: (refund: Refund) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <MobileCardTop title={refund.coachName} end={<StatusBadge status={refundStatusKey(refund.status)} />} />
      <MobileCardLine label="هنرجو" value={refund.studentName} />
      <MobileCardLine label="مسابقه" value={refund.competitionTitle} />
      <MobileCardLine label="مبلغ" value={<span className="tabular-nums">{formatRialsAsToman(Number(refund.amount))}</span>} />
      <MobileCardChips>
        <span className="text-subtle text-muted-foreground">{refundReasonLabels[refund.reason]}</span>
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(refund.createdAt))}</span>
      </MobileCardChips>
      {refund.status === "PENDING" ? (
        <Button variant="outline" size="sm" className="h-11 w-full sm:h-9" onClick={() => onComplete(refund)}>
          ثبت بازپرداخت
        </Button>
      ) : null}
    </div>
  );
}
