"use client";

import { BanknoteIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DescriptionList, IconTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatCardNumber, formatNumber, formatRialsAsToman } from "@/lib/format";

export function PaymentInfoSection({
  cardNumber,
  cardHolder,
  selectedCount,
  amountRials,
}: {
  cardNumber: string;
  cardHolder: string;
  selectedCount: number;
  amountRials: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCardNumber() {
    await navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    toast.success("شماره کارت کپی شد");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-primary-subtle px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-subtle text-muted-foreground tabular-nums">مبلغ ثبت نام ({formatNumber(selectedCount)} هنرجو)</span>
          <span className="text-display font-semibold tabular-nums">{formatRialsAsToman(Number(amountRials))}</span>
        </div>
        <IconTile icon={BanknoteIcon} />
      </div>
      <DescriptionList
        items={[
          { term: "صاحب کارت", value: cardHolder },
          {
            term: "شماره کارت",
            value: (
              <span className="inline-flex items-center gap-2">
                <span className="font-medium tabular-nums tracking-wide">{formatCardNumber(cardNumber)}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="کپی شماره کارت" onClick={() => void copyCardNumber()}>
                  {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
                </Button>
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
