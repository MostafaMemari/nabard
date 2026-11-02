import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

function normalizeWeight(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/٫/g, ".")
    .trim();
}

export const studentSchema = z.object({
  fullName: z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید."),
  gender: z.string().min(1, "جنسیت را انتخاب کنید."),
  nationalCode: z
    .string()
    .transform(normalizeDigits)
    .pipe(z.string().regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد.")),
  birthDate: z.string().min(1, "تاریخ تولد را انتخاب کنید."),
  beltId: z.string().min(1, "کمربند را انتخاب کنید."),
  weightKg: z
    .string()
    .transform(normalizeWeight)
    .pipe(
      z.string().refine((value) => value === "" || (/^\d{1,3}(\.\d)?$/.test(value) && Number(value) > 0), {
        message: "وزن را با یک رقم اعشار وارد کنید؛ مثلاً ۵۴٫۵",
      }),
    ),
});

export type StudentFormValues = z.input<typeof studentSchema>;

export const emptyStudentForm: StudentFormValues = {
  fullName: "",
  gender: "",
  nationalCode: "",
  birthDate: "",
  beltId: "",
  weightKg: "",
};
