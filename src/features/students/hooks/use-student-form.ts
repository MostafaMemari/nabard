"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createStudent } from "../api";
import { emptyStudentForm, type StudentFormValues, studentSchema } from "../schemas";

export function useStudentForm() {
  const router = useRouter();
  const form = useForm<StudentFormValues, unknown, StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyStudentForm,
  });

  async function submit(values: StudentFormValues) {
    const input = {
      fullName: values.fullName.trim(),
      nationalCode: values.nationalCode,
      birthDate: values.birthDate,
      mobile: values.mobile,
      beltId: values.beltId,
      beltCertificateDate: values.beltCertificateDate,
      insuranceDate: values.insuranceDate,
      tkdBankChargeDate: values.tkdBankChargeDate,
    };

    try {
      await createStudent(input);
      toast.success("درخواست ثبت هنرجو ثبت شد و برای بررسی به ادمین استان ارسال شد.");
      router.push("/coach/students");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return { form, submit };
}
