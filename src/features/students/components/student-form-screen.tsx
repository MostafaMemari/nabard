"use client";
import { ImageIcon, UsersIcon } from "lucide-react";

import { ControlledDateField, ControlledTextField, FormActions, FormContainer, FormSection, PageHeader } from "@/components/shared";
import { useStudentForm } from "../hooks/use-student-form";

export function StudentFormScreen() {
  const { form, submit } = useStudentForm();

  return (
    <FormContainer variant="student">
      <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-6">
        <PageHeader
          title="هنرجوی جدید"
          description="اطلاعات هنرجو را وارد کنید. پس از ثبت، اطلاعات قفل می شود و کمربند را ادمین استان ثبت می کند."
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
          <ControlledDateField control={form.control} name="birthDate" label="تاریخ تولد" />
          <ControlledDateField control={form.control} name="insuranceDate" label="تاریخ بیمه ورزشی" />
          <ControlledDateField control={form.control} name="tkdBankChargeDate" label="تاریخ شارژ بانک اطلاعات تکواندو" />
        </FormSection>

        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-subtle text-muted-foreground">
          <ImageIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          مدارک (عکس پرسنلی، کارت ملی یا شناسنامه و بیمه ورزشی) را پس از ثبت، در صفحه هنرجو بارگذاری کنید.
        </p>

        <FormActions cancelHref="/coach/students" submitLabel="ذخیره" submitting={form.formState.isSubmitting} />
      </form>
    </FormContainer>
  );
}
