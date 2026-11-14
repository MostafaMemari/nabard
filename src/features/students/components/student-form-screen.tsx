"use client";
import { ImageIcon, MedalIcon, UsersIcon } from "lucide-react";

import {
  ControlledDateField,
  ControlledSelectField,
  ControlledTextField,
  FormActions,
  FormContainer,
  FormSection,
  PageHeader,
} from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { useStudentForm } from "../hooks/use-student-form";
import { tkdBankChargeYearItems } from "../year-items";

export function StudentFormScreen() {
  const { form, submit } = useStudentForm();
  const { belts } = useBelts();
  const beltItems = Object.fromEntries(belts.filter((belt) => belt.isActive).map((belt) => [belt.id, belt.label]));

  return (
    <FormContainer variant="student">
      <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-6">
        <PageHeader
          title="هنرجوی جدید"
          description="اطلاعات هنرجو را وارد کنید. درخواست ثبت برای بررسی به ادمین استان ارسال می شود و پس از تأیید، هنرجو اضافه می شود"
        />

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

        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-subtle text-muted-foreground">
          <MedalIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          درخواست ثبت هنرجو با کمربند و تاریخ حکم انتخابی برای ادمین استان ارسال می شود
        </p>

        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-subtle text-muted-foreground">
          <ImageIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          پس از ثبت درخواست، عکس پرسنلی را از صفحه درخواست ها بارگذاری کنید؛ بدون عکس، درخواست قابل تأیید نیست
        </p>

        <FormActions cancelHref="/coach/students" submitLabel="ثبت درخواست" submitting={form.formState.isSubmitting} />
      </form>
    </FormContainer>
  );
}
