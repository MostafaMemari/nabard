"use client";

import Link from "next/link";
import { Avatar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { SummaryPendingPayment } from "@/features/summary";
import { formatJalaliDateTime, formatRialsAsToman } from "@/lib/format";

export function AdminActionList({ payments }: { payments: SummaryPendingPayment[] }) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
          <Avatar id={payment.coachId} name={payment.coachName} size="md" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{payment.coachName}</p>
            <p className="text-subtle mt-0.5 text-muted-foreground tabular-nums">
              {formatRialsAsToman(Number(payment.amount))} · {formatJalaliDateTime(new Date(payment.createdAt))}
            </p>
          </div>
          <Button size="sm" className="h-11 md:h-8" render={<Link href={`/admin/payments/${payment.id}`} />}>
            بررسی
          </Button>
        </div>
      ))}
    </div>
  );
}
