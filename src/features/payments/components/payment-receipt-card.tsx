"use client";

import Image from "next/image";
import { formatJalaliDateTime, toPersianDigits } from "@/lib/format";
import type { Payment } from "../types";

export function PaymentReceiptCard({ payment }: { payment: Payment }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">تصویر رسید</h2>
        <span className="text-subtle text-muted-foreground">ارسال شده در {formatJalaliDateTime(new Date(payment.createdAt))}</span>
      </div>

      {payment.receiptKey === null ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
          رسیدی برای این پرداخت بارگذاری نشده است.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-muted/30 p-3">
          <Image
            src="/receipts/receipt-sample.png"
            alt={`رسید پرداخت ${toPersianDigits(payment.id)}`}
            width={640}
            height={880}
            className="mx-auto h-auto w-full max-w-sm rounded-md"
          />
        </div>
      )}

      {payment.status === "REJECTED" && payment.note ? (
        <p className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">دلیل رد: {payment.note}</p>
      ) : null}
    </section>
  );
}
