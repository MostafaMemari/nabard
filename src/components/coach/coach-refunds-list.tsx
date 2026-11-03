"use client";

import {
  ErrorBanner,
  MobileCard,
  MobileCardChips,
  MobileCardLine,
  MobileCardTop,
  SkeletonRows,
  StateCard,
  StatusBadge,
} from "@/components/shared";
import { refundReasonLabels, refundStatusKey, useRefunds } from "@/features/refunds";
import { formatJalaliDate, formatRialsAsToman } from "@/lib/format";

export function CoachRefundsList() {
  const { refunds, isLoading, error, mutate } = useRefunds();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">بازپرداخت ها</h2>
      {error ? (
        <ErrorBanner onRetry={() => mutate()} />
      ) : isLoading ? (
        <StateCard className="p-4">
          <SkeletonRows rows={2} className="h-24" />
        </StateCard>
      ) : refunds.length === 0 ? null : (
        <div className="flex flex-col gap-3">
          {refunds.map((refund) => (
            <MobileCard key={refund.id}>
              <MobileCardTop title={refund.studentName} end={<StatusBadge status={refundStatusKey(refund.status)} />} />
              <MobileCardLine label="مسابقه" value={refund.competitionTitle} />
              <MobileCardLine label="مبلغ" value={<span className="tabular-nums">{formatRialsAsToman(Number(refund.amount))}</span>} />
              <MobileCardChips>
                <span className="text-subtle text-muted-foreground">{refundReasonLabels[refund.reason]}</span>
                <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(refund.createdAt))}</span>
              </MobileCardChips>
            </MobileCard>
          ))}
        </div>
      )}
    </section>
  );
}
