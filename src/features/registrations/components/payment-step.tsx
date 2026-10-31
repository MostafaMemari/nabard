"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DescriptionList, FormSection } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatNumber, formatRialsAsToman } from "@/lib/format";
import { ReceiptUploadField } from "./receipt-upload-field";

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})(?=\d)/g, "$1-").replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

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
  const [copied, setCopied] = useState(false);

  function selectFile(next: File | null) {
    if (next && !next.type.startsWith("image/")) {
      setError("فقط تصویر رسید قابل قبول است.");
      return;
    }

    if (next && next.size > MAX_RECEIPT_SIZE_BYTES) {
      setError("حجم تصویر باید کمتر از ۵ مگابایت باشد.");
      return;
    }

    setError(null);
    setFile(next);
  }

  async function copyCardNumber() {
    await navigator.clipboard.writeText(payeeCardNumber);
    setCopied(true);
    toast.success("شماره کارت کپی شد.");
    setTimeout(() => setCopied(false), 2000);
  }

  function submit() {
    if (!file) {
      setError("برای ثبت پرداخت، ابتدا تصویر رسید را بارگذاری کنید.");
      return;
    }

    onSubmit(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <FormSection title="اطلاعات پرداخت" description="مبلغ را کارت‌به‌کارت واریز کنید و تصویر رسید را بارگذاری کنید.">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-primary-subtle px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-subtle text-muted-foreground">مبلغ ثبت‌نام ({formatNumber(selectedCount)} هنرجو)</span>
            <span className="text-display font-semibold">{formatRialsAsToman(Number(amountRials))}</span>
          </div>
        </div>
        <DescriptionList
          items={[
            { term: "صاحب کارت", value: payeeCardHolder },
            {
              term: "شماره کارت",
              value: (
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium tracking-wide">{formatCardNumber(payeeCardNumber)}</span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="کپی شماره کارت" onClick={() => void copyCardNumber()}>
                    {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
                  </Button>
                </span>
              ),
            },
          ]}
        />
      </FormSection>
      <FormSection title="رسید پرداخت" description="تصویر رسید کارت‌به‌کارت را بارگذاری کنید.">
        <ReceiptUploadField file={file} onChange={selectFile} />
        {error ? <p className="text-subtle text-danger">{error}</p> : null}
      </FormSection>
      <div className="flex items-center justify-end gap-3">
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
