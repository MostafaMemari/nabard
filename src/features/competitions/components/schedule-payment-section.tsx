"use client";
import { BanknoteIcon } from "lucide-react";

import type { Control } from "react-hook-form";
import { FormSection } from "@/components/shared";
import type { CompetitionFormValues } from "../schemas";
import { FormDateField, FormTextField } from "./form-fields";

export function SchedulePaymentSection({ control }: { control: Control<CompetitionFormValues> }) {
  return (
    <FormSection title="زمان و پرداخت" description="مهلت ثبت نام، تاریخ برگزاری و اطلاعات پرداخت هزینه." icon={BanknoteIcon}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormDateField control={control} name="registrationDeadline" label="مهلت ثبت نام" />
        <FormDateField control={control} name="eventDate" label="تاریخ برگزاری" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField
          control={control}
          name="feePerStudent"
          label="هزینه هر هنرجو (ریال)"
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          placeholder="۳۵۰۰۰۰۰"
        />
        <FormTextField
          control={control}
          name="payeeCardNumber"
          label="شماره کارت دریافت کننده"
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          placeholder="۶۱۰۴۳۳۷۸۱۲۳۴۵۶۷۸"
        />
      </div>
      <FormTextField control={control} name="payeeCardHolder" label="نام صاحب کارت" placeholder="فدراسیون تکواندو استان تهران" />
    </FormSection>
  );
}
