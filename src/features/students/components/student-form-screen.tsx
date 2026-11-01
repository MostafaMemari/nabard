"use client";
import { UsersIcon } from "lucide-react";

import Link from "next/link";
import { EmptyState, FormActions, FormContainer, FormSection, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentForm } from "../hooks/use-student-form";
import { StudentBeltField, StudentBirthDateField, StudentSelectField, StudentTextField } from "./student-form-fields";

export function StudentFormScreen({ studentId }: { studentId?: string }) {
  const { isEdit, form, belts, isLoading, error, student, submit } = useStudentForm({ studentId });

  if (isEdit && isLoading) {
    return (
      <FormContainer variant="student" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
      </FormContainer>
    );
  }

  if (isEdit && (error || !student)) {
    return (
      <FormContainer variant="student">
        <PageHeader title="ویرایش هنرجو" />
        <div className="mt-4 rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            title="این هنرجو پیدا نشد یا به فهرست شما تعلق ندارد."
            action={
              <Button size="sm" variant="outline" render={<Link href="/coach/students" />}>
                بازگشت به هنرجویان
              </Button>
            }
          />
        </div>
      </FormContainer>
    );
  }

  return (
    <FormContainer variant="student">
      <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        <PageHeader
          title={isEdit ? "ویرایش هنرجو" : "هنرجوی جدید"}
          description={isEdit ? "اطلاعات هنرجو را ویرایش کنید." : "اطلاعات هنرجو را وارد کنید تا در ثبت نام مسابقات قابل استفاده باشد."}
        />

        <FormSection title="اطلاعات هنرجو" icon={UsersIcon}>
          <StudentTextField
            control={form.control}
            name="fullName"
            label="نام و نام خانوادگی"
            placeholder="مثلاً علی رضایی"
            autoComplete="off"
          />
          <StudentSelectField control={form.control} name="gender" label="جنسیت" items={{ MALE: "پسر", FEMALE: "دختر" }} />
          <StudentTextField
            control={form.control}
            name="nationalCode"
            label="کد ملی"
            inputMode="numeric"
            dir="ltr"
            placeholder="۰۰۱۲۳۴۵۶۷۸۹"
            spellCheck={false}
            autoComplete="off"
          />
          <StudentBirthDateField control={form.control} name="birthDate" label="تاریخ تولد" />
          <StudentBeltField control={form.control} name="beltId" label="کمربند" belts={belts} />
          <StudentTextField
            control={form.control}
            name="weightKg"
            label="وزن (کیلوگرم)"
            inputMode="decimal"
            dir="ltr"
            placeholder="مثلاً ۵۴٫۵"
            autoComplete="off"
          />
        </FormSection>

        <FormActions cancelHref="/coach/students" submitLabel="ذخیره" submitting={form.formState.isSubmitting} />
      </form>
    </FormContainer>
  );
}
