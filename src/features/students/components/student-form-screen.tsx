"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState, FormSection, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Gender, useBelts } from "@/features/base-data";
import { createStudent, updateStudent } from "../api";
import { useStudent } from "../hooks/use-student";
import { emptyStudentForm, type StudentFormValues, studentSchema } from "../schemas";
import type { StudentInput } from "../types";
import { StudentBeltField, StudentBirthDateField, StudentSelectField, StudentTextField } from "./student-form-fields";

export function StudentFormScreen({ coachId, studentId }: { coachId: string; studentId?: string }) {
  const router = useRouter();
  const isEdit = studentId !== undefined;
  const { student, isLoading, error } = useStudent(studentId ?? "");
  const { belts } = useBelts();

  const form = useForm<StudentFormValues, unknown, StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyStudentForm,
  });

  useEffect(() => {
    if (isEdit && student) {
      form.reset({
        fullName: student.fullName,
        gender: student.gender,
        nationalCode: student.nationalCode,
        birthDate: student.birthDate,
        beltId: student.beltId,
        weightKg: student.weightKg !== null ? String(student.weightKg) : "",
      });
    }
  }, [isEdit, student, form]);

  async function submit(values: StudentFormValues) {
    const input: StudentInput = {
      fullName: values.fullName.trim(),
      gender: values.gender as Gender,
      nationalCode: values.nationalCode,
      birthDate: values.birthDate,
      beltId: values.beltId,
      weightKg: values.weightKg === "" ? null : Number(values.weightKg),
      coachId,
    };

    try {
      if (isEdit && studentId) {
        await updateStudent(studentId, input);
      } else {
        await createStudent(input);
      }
      toast.success(isEdit ? "تغییرات هنرجو ذخیره شد." : "هنرجو اضافه شد.");
      router.push("/coach/students");
    } catch {
      toast.error("ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isEdit && (error || !student)) {
    return (
      <div className="mx-auto w-full max-w-[560px]">
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
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      <PageHeader
        title={isEdit ? "ویرایش هنرجو" : "هنرجوی جدید"}
        description={isEdit ? "اطلاعات هنرجو را ویرایش کنید." : "اطلاعات هنرجو را وارد کنید تا در ثبت‌نام مسابقات قابل استفاده باشد."}
      />

      <FormSection title="اطلاعات هنرجو">
        <StudentTextField control={form.control} name="fullName" label="نام و نام خانوادگی" placeholder="مثلاً علی رضایی" />
        <StudentSelectField control={form.control} name="gender" label="جنسیت" items={{ MALE: "پسر", FEMALE: "دختر" }} />
        <StudentTextField control={form.control} name="nationalCode" label="کد ملی" inputMode="numeric" placeholder="۰۰۱۲۳۴۵۶۷۸۹" />
        <StudentBirthDateField control={form.control} name="birthDate" label="تاریخ تولد" />
        <StudentBeltField control={form.control} name="beltId" label="کمربند" belts={belts} />
        <StudentTextField control={form.control} name="weightKg" label="وزن (کیلوگرم)" inputMode="decimal" placeholder="مثلاً ۵۴٫۵" />
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" render={<Link href="/coach/students" />}>
          انصراف
        </Button>
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
        </Button>
      </div>
    </form>
  );
}
