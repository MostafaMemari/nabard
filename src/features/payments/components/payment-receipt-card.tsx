"use client";

import { ReceiptTextIcon, ZoomInIcon } from "lucide-react";
import { useState } from "react";
import { IconTile } from "@/components/shared";
import { formatJalaliDateTime } from "@/lib/format";
import { buildApiUrl } from "@/lib/http";
import type { Payment } from "../types";
import { ReceiptLightbox } from "./receipt-lightbox";

export function PaymentReceiptCard({ payment }: { payment: Payment }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const receiptUrl = buildApiUrl(`/api/v1/payments/${payment.id}/receipt`);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={ReceiptTextIcon} />
          <h2 className="text-base font-semibold">تصویر رسید</h2>
        </div>
        <span className="text-subtle text-muted-foreground">ارسال شده در {formatJalaliDateTime(new Date(payment.createdAt))}</span>
      </div>

      {payment.receiptKey === null ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
          <IconTile icon={ReceiptTextIcon} tone="pending" />
          رسیدی برای این پرداخت بارگذاری نشده است.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-muted/30 p-3">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="نمایش بزرگ تصویر رسید"
              className="group relative mx-auto block w-full max-w-sm cursor-zoom-in overflow-hidden rounded-md"
            >
              {/* biome-ignore lint/performance/noImgElement: private receipt served by an authenticated endpoint */}
              <img
                src={receiptUrl}
                alt="تصویر رسید پرداخت کارت به کارت"
                width={480}
                height={640}
                className="h-auto w-full transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
                <ZoomInIcon aria-hidden className="size-3.5" />
                بزرگ‌نمایی
              </span>
            </button>
          </div>
          <ReceiptLightbox open={lightboxOpen} onOpenChange={setLightboxOpen} src={receiptUrl} />
        </>
      )}

      {payment.status === "REJECTED" && payment.note ? (
        <p className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">دلیل رد: {payment.note}</p>
      ) : null}
    </section>
  );
}
