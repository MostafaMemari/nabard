"use client";

import { useState } from "react";
import { FormSection } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { PaymentInfoSection } from "./payment-info-section";
import { ReceiptUploadField } from "./receipt-upload-field";

export function PaymentStep({
  payeeCardNumber,
  payeeCardHolder,
  selectedCount,
  amountRials,
  submitting,
  onBack,
  onSubmit,
}: {
  payeeCardNumber: string;
  payeeCardHolder: string;
  selectedCount: number;
  amountRials: string;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (receipt: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!file) {
      setError("برای ثبت پرداخت، ابتدا تصویر رسید را بارگذاری کنید");
      return;
    }

    onSubmit(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="اطلاعات پرداخت" description="مبلغ را به شماره کارت زیر واریز کنید">
        <PaymentInfoSection
          cardNumber={payeeCardNumber}
          cardHolder={payeeCardHolder}
          selectedCount={selectedCount}
          amountRials={amountRials}
        />
      </FormSection>
      <FormSection title="رسید پرداخت" description="تصویر رسید کارت به کارت را بارگذاری کنید">
        <ReceiptUploadField file={file} onChange={setFile} />
        {error ? (
          <p role="alert" className="text-subtle text-danger">
            {error}
          </p>
        ) : null}
      </FormSection>
      {/* Same sticky action bar as FormActions, with بازگشت instead of a cancel link. */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-xl border border-border bg-card px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-card">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          بازگشت
        </Button>
        <Button type="button" onClick={submit} disabled={submitting}>
          ثبت پرداخت
        </Button>
      </div>
    </div>
  );
}
