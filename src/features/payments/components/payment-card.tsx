"use client";

import { Avatar, MobileCardChips, MobileCardLine, MobileCardLink, MobileCardTop, StatusBadge } from "@/components/shared";
import { useCompetitions } from "@/features/competitions";
import { useRegistrations } from "@/features/registrations";
import { useCoaches } from "@/features/users";
import { formatJalaliDate, formatNumber, formatRialsAsToman } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { Payment } from "../types";

export function PaymentCard({ payment }: { payment: Payment }) {
  const { coaches } = useCoaches();
  const { competitions } = useCompetitions();
  const { registrations } = useRegistrations();

  const coachName = coaches.find((coach) => coach.id === payment.coachId)?.fullName ?? payment.coachId;
  const competitionTitle = competitions.find((competition) => competition.id === payment.competitionId)?.title ?? payment.competitionId;
  const studentCount = registrations.filter((registration) => registration.paymentId === payment.id).length;

  return (
    <MobileCardLink href={`/admin/payments/${payment.id}`}>
      <MobileCardTop
        leading={<Avatar id={payment.coachId} name={coachName} size="md" />}
        title={coachName}
        end={<StatusBadge status={paymentBadgeStatus(payment.status)} />}
      />
      <MobileCardLine label="مسابقه" value={competitionTitle} />
      <MobileCardLine label="مبلغ" value={<span className="tabular-nums">{formatRialsAsToman(Number(payment.amount))}</span>} />
      <MobileCardChips>
        <span className="text-subtle text-muted-foreground tabular-nums">{formatNumber(studentCount)} هنرجو</span>
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(payment.createdAt))}</span>
      </MobileCardChips>
    </MobileCardLink>
  );
}
