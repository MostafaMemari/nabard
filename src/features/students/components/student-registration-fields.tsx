"use client";

import { UsersIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { ControlledDateField, ControlledSelectField, ControlledTextField, FormSection } from "@/components/shared";
import type { Belt } from "@/features/base-data";
import type { StudentFormValues } from "../schemas";
import { tkdBankChargeYearItems } from "../year-items";

// The shared student registration fields: the same block drives the
// registration request page (/coach/students/new) and its edit page
// (/coach/requests/[id]/edit).
export function StudentRegistrationFields({
  form,
  belts,
}: {
  form: UseFormReturn<StudentFormValues, unknown, StudentFormValues>;
  belts: Belt[];
}) {
  const beltItems = Object.fromEntries(belts.filter((belt) => belt.isActive).map((belt) => [belt.id, belt.label]));

  return (
    <FormSection title="اطلاعات هنرجو" icon={UsersIcon}>
      <ControlledTextField
        control={form.control}
        name="fullName"
        label="نام و نام خانوادگی"
        placeholder="مثلاً علی رضایی"
        autoComplete="off"
      />
      <ControlledTextField
        control={form.control}
        name="nationalCode"
        label="کد ملی"
        inputMode="numeric"
        dir="ltr"
        placeholder="۰۰۱۲۳۴۵۶۷۸۹"
        spellCheck={false}
        autoComplete="off"
      />
      <ControlledTextField
        control={form.control}
        name="mobile"
        label="تلفن همراه"
        inputMode="numeric"
        dir="ltr"
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        autoComplete="off"
      />
      <ControlledDateField control={form.control} name="birthDate" label="تاریخ تولد" variant="birth" />
      <ControlledSelectField control={form.control} name="beltId" label="کمربند" placeholder="انتخاب کمربند" items={beltItems} />
      <ControlledDateField control={form.control} name="beltCertificateDate" label="تاریخ حکم کمربند (اختیاری)" />
      <ControlledDateField control={form.control} name="insuranceDate" label="تاریخ بیمه ورزشی (اختیاری)" />
      <ControlledSelectField
        control={form.control}
        name="tkdBankChargeYear"
        label="سال شارژ بانک اطلاعات تکواندو (اختیاری)"
        placeholder="انتخاب سال"
        items={tkdBankChargeYearItems}
      />
    </FormSection>
  );
}
