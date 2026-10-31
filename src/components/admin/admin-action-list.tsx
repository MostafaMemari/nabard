"use client";

import Link from "next/link";
import { Avatar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/features/payments/types";
import { useCoaches } from "@/features/users";
import { formatJalaliDateTime, formatRialsAsToman } from "@/lib/format";

export function AdminActionList({ payments }: { payments: Payment[] }) {
  const { coaches } = useCoaches();

  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {payments.map((payment) => {
        const coach = coaches.find((item) => item.id === payment.coachId);
        return (
          <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar id={payment.coachId} name={coach?.fullName ?? payment.coachId} size="md" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{coach?.fullName ?? "—"}</p>
              <p className="text-subtle mt-0.5 text-muted-foreground tabular-nums">
                {formatRialsAsToman(Number(payment.amount))} · {formatJalaliDateTime(new Date(payment.createdAt))}
              </p>
            </div>
            <Button size="sm" className="h-11 md:h-8" render={<Link href={`/admin/payments/${payment.id}`} />}>
              بررسی
            </Button>
          </div>
        );
      })}
    </div>
  );
}
