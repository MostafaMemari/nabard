"use client";
import { ImageIcon, MedalIcon } from "lucide-react";

import { FormActions, FormContainer, PageHeader } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import { useStudentForm } from "../hooks/use-student-form";
import { StudentRegistrationFields } from "./student-registration-fields";

export function StudentFormScreen() {
  const { form, submit } = useStudentForm();
  const { belts } = useBelts();

  return (
    <FormContainer variant="student">
      <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-6">
        <PageHeader
          title="هنرجوی جدید"
          description="اطلاعات هنرجو را وارد کنید. درخواست ثبت برای بررسی به ادمین استان ارسال می شود و پس از تأیید، هنرجو اضافه می شود"
        />

        <StudentRegistrationFields form={form} belts={belts} />

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
