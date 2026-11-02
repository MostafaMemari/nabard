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
      insuranceDate: values.insuranceDate,
      tkdBankChargeDate: values.tkdBankChargeDate,
    };

    try {
      await createStudent(input);
      toast.success("هنرجو اضافه شد.");
      router.push("/coach/students");
    } catch {
      toast.error("ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return { form, submit };
}
