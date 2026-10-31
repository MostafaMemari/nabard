"use client";

import { Avatar, MobileCardChips, MobileCardLine, MobileCardLink, MobileCardTop, StatusBadge } from "@/components/shared";
import { formatJalaliDate, formatNumber, formatRialsAsToman } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { Payment } from "../types";
import { usePaymentMeta } from "./use-payment-meta";

export function PaymentCard({ payment }: { payment: Payment }) {
  const { coachName, competitionTitle, studentCount } = usePaymentMeta();

  return (
    <MobileCardLink href={`/admin/payments/${payment.id}`}>
      <MobileCardTop
        leading={<Avatar id={payment.coachId} name={coachName(payment.coachId)} size="md" />}
        title={coachName(payment.coachId)}
        end={<StatusBadge status={paymentBadgeStatus(payment.status)} />}
      />
      <MobileCardLine label="مسابقه" value={competitionTitle(payment.competitionId)} />
      <MobileCardLine label="مبلغ" value={<span className="tabular-nums">{formatRialsAsToman(Number(payment.amount))}</span>} />
      <MobileCardChips>
        <span className="text-subtle text-muted-foreground tabular-nums">{formatNumber(studentCount(payment.id))} هنرجو</span>
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(payment.createdAt))}</span>
      </MobileCardChips>
    </MobileCardLink>
  );
}
