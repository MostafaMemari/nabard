import { z } from "zod";

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

export function createCompetitionSchema(beltLevels: Record<string, number>) {
  return z
    .object({
      title: z.string().trim().min(3, "عنوان مسابقه باید حداقل ۳ حرف باشد."),
      discipline: z.string().min(1, "رشته را انتخاب کنید."),
      gender: z.string().min(1, "جنسیت را انتخاب کنید."),
      ageCategoryId: z.string().min(1, "رده سنی را انتخاب کنید."),
      minBeltId: z.string().min(1, "کمربند ابتدایی را انتخاب کنید."),
      maxBeltId: z.string().min(1, "کمربند پایانی را انتخاب کنید."),
      feePerStudent: z
        .string()
        .transform(normalizeDigits)
        .pipe(z.string().refine((value) => value !== "" && Number(value) > 0, "هزینه هر هنرجو را به ریال وارد کنید.")),
      payeeCardNumber: z.string().transform(normalizeDigits).pipe(z.string().length(16, "شماره کارت باید ۱۶ رقم باشد.")),
      payeeCardHolder: z.string().trim().min(3, "نام صاحب کارت را وارد کنید."),
      registrationDeadline: z.string().min(1, "مهلت ثبت‌نام را انتخاب کنید."),
      eventDate: z.string().min(1, "تاریخ برگزاری را انتخاب کنید."),
    })
    .refine((data) => (beltLevels[data.minBeltId] ?? 0) <= (beltLevels[data.maxBeltId] ?? 0), {
      message: "کمربند پایانی باید رتبه‌ای بعد از کمربند ابتدایی باشد.",
      path: ["maxBeltId"],
    })
    .refine((data) => data.eventDate > data.registrationDeadline, {
      message: "تاریخ برگزاری باید بعد از مهلت ثبت‌نام باشد.",
      path: ["eventDate"],
    });
}

export type CompetitionFormValues = {
  title: string;
  discipline: string;
  gender: string;
  ageCategoryId: string;
  minBeltId: string;
  maxBeltId: string;
  feePerStudent: string;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: string;
  eventDate: string;
};

export const emptyCompetitionForm: CompetitionFormValues = {
  title: "",
  discipline: "",
  gender: "",
  ageCategoryId: "",
  minBeltId: "",
  maxBeltId: "",
  feePerStudent: "",
  payeeCardNumber: "",
  payeeCardHolder: "",
  registrationDeadline: "",
  eventDate: "",
};
