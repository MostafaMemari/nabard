"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type Gender, useBelts } from "@/features/base-data";
import { createStudent, updateStudent } from "../api";
import { useStudent } from "../hooks/use-student";
import { emptyStudentForm, type StudentFormValues, studentSchema } from "../schemas";
import type { StudentInput } from "../types";

export function useStudentForm({ coachId, studentId }: { coachId: string; studentId?: string }) {
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

  return { isEdit, form, belts, isLoading, error, student, submit };
}
