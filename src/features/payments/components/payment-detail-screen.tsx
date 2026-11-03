"use client";

import { DetailPageHeader, ErrorBanner, SkeletonRows, StateCard } from "@/components/shared";
import { usePaymentDecisions } from "../hooks/use-payment-decisions";
import { PaymentDetailContent } from "./payment-detail-content";

export function PaymentDetailScreen({ paymentId }: { paymentId: string }) {
  const decisions = usePaymentDecisions(paymentId);
  const { payment, isLoading, error, mutate } = decisions;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonRows rows={1} className="h-8" />
        <StateCard className="p-4">
          <SkeletonRows rows={4} />
        </StateCard>
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
