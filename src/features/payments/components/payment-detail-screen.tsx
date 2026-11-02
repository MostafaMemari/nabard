"use client";

import { DetailPageHeader, ErrorBanner } from "@/components/shared";
import { SkeletonRows } from "@/components/shared/rows-skeleton";
import { usePaymentDecisions } from "../hooks/use-payment-decisions";
import { PaymentDetailContent } from "./payment-detail-content";

export function PaymentDetailScreen({ paymentId }: { paymentId: string }) {
  const decisions = usePaymentDecisions(paymentId);
  const { payment, isLoading, error, mutate } = decisions;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <SkeletonRows rows={4} />
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex flex-col gap-4">
        <DetailPageHeader backHref="/admin/payments" backLabel="بررسی پرداخت ها" title="رسید پرداخت مربی" />
        <ErrorBanner message="پرداخت یافت نشد." onRetry={() => mutate()} />
      </div>
    );
  }

  return <PaymentDetailContent decisions={decisions} />;
}
