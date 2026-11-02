"use client";

import { UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, DescriptionList, IconTile, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Competition } from "@/features/competitions";
import type { User } from "@/features/users";
import { formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { Payment } from "../types";

export function PaymentSideSummary({
  payment,
  coach,
  competition,
  studentCount,
  working,
  onConfirmReceipt,
  onOpenReject,
}: {
  payment: Payment;
  coach: User | undefined;
  competition: Competition | undefined;
  studentCount: number;
  working: boolean;
  onConfirmReceipt: () => Promise<void>;
  onOpenReject: () => void;
}) {
  const decided = payment.status !== "PENDING";

  return (
    <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-8">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
        <div className="flex items-center gap-3">
          <IconTile icon={UserRoundIcon} />
          <h2 className="text-base font-semibold">خلاصه پرداخت</h2>
        </div>
        <div className="flex items-center gap-3">
          <Avatar id={payment.coachId} name={coach?.fullName ?? payment.coachId} size="md" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{coach?.fullName ?? payment.coachId}</span>
            <span className="text-subtle text-muted-foreground">{coach ? toPersianDigits(coach.mobile) : "-"}</span>
          </div>
        </div>
        <DescriptionList
          items={[
            {
              term: "مسابقه",
              value: competition ? (
                <Link href={`/admin/competitions/${competition.id}`} className="text-primary hover:underline">
                  {competition.title}
                </Link>
              ) : (
                payment.competitionId
              ),
            },
            { term: "تعداد هنرجویان", value: `${toPersianDigits(studentCount)} هنرجو` },
            { term: "مبلغ", value: <span className="tabular-nums">{formatRialsAsToman(Number(payment.amount))}</span> },
            { term: "وضعیت رسید", value: <StatusBadge status={paymentBadgeStatus(payment.status)} /> },
          ]}
        />
        {decided ? (
          <p className="text-subtle text-muted-foreground">
            {payment.status === "CONFIRMED" ? "این رسید تأیید شده است." : "این رسید رد شده است."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <Button disabled={working} onClick={() => void onConfirmReceipt()}>
              تأیید رسید
            </Button>
            <Button
              variant="outline"
              className="text-danger hover:bg-danger-bg hover:text-danger"
              disabled={working}
              onClick={onOpenReject}
            >
              رد رسید
            </Button>
          </div>
        )}
      </section>
    </aside>
  );
}
