import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

export const competitionSchema = z
  .object({
    title: z.string().trim().min(3, "عنوان مسابقه باید حداقل ۳ حرف باشد."),
    discipline: z.string().min(1, "رشته را انتخاب کنید."),
    gender: z.string().min(1, "جنسیت را انتخاب کنید."),
    ageCategoryId: z.string().min(1, "رده سنی را انتخاب کنید."),
    beltIds: z.array(z.string()).min(1, "حداقل یک کمربند را انتخاب کنید."),
    feePerStudent: z
      .string()
      .transform(normalizeDigits)
      .pipe(z.string().refine((value) => value !== "" && Number(value) > 0, "هزینه هر هنرجو را به ریال وارد کنید.")),
    payeeCardNumber: z.string().transform(normalizeDigits).pipe(z.string().length(16, "شماره کارت باید ۱۶ رقم باشد.")),
    payeeCardHolder: z.string().trim().min(3, "نام صاحب کارت را وارد کنید."),
    registrationDeadline: z.string().min(1, "مهلت ثبت‌نام را انتخاب کنید."),
    eventDate: z.string().min(1, "تاریخ برگزاری را انتخاب کنید."),
  })
  .refine((data) => data.eventDate > data.registrationDeadline, {
    message: "تاریخ برگزاری باید بعد از مهلت ثبت‌نام باشد.",
    path: ["eventDate"],
  });

export type CompetitionFormValues = {
  title: string;
  discipline: string;
  gender: string;
  ageCategoryId: string;
  beltIds: string[];
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
  beltIds: [],
  feePerStudent: "",
  payeeCardNumber: "",
  payeeCardHolder: "",
  registrationDeadline: "",
  eventDate: "",
};
