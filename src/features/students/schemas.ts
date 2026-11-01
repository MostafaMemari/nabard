import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

function normalizeWeight(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/٫/g, ".")
    .trim();
}

export function isValidNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;

  const sum = code
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;

  return Number(code[9]) === (remainder < 2 ? remainder : 11 - remainder);
}

function isPastIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function hasOneDecimal(value: number): boolean {
  return value > 0 && value <= 999.9 && /^\d+(\.\d)?$/.test(String(value));
}

const fullNameField = z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.");
const genderField = z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید." });
const beltIdField = z.string().min(1, "کمربند را انتخاب کنید.");
const nationalCodeField = z
  .string()
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد."))
  .refine(isValidNationalCode, "کد ملی وارد شده معتبر نیست.");
const birthDateField = z
  .string()
  .min(1, "تاریخ تولد را انتخاب کنید.")
  .refine(isPastIsoDate, "تاریخ تولد باید یک تاریخ گذشته و معتبر باشد.");
const weightKgField = z.number().refine(hasOneDecimal, "وزن باید یک عدد مثبت با حداکثر یک رقم اعشار باشد.");

export const studentSchema = z.object({
  fullName: fullNameField,
  gender: z.string().min(1, "جنسیت را انتخاب کنید."),
  nationalCode: nationalCodeField,
  birthDate: birthDateField,
  beltId: beltIdField,
  weightKg: z
    .string()
    .transform(normalizeWeight)
    .pipe(
      z.string().refine((value) => value === "" || (/^\d{1,3}(\.\d)?$/.test(value) && Number(value) > 0), {
        message: "وزن را با یک رقم اعشار وارد کنید؛ مثلاً ۵۴٫۵",
      }),
    ),
});

export const createStudentSchema = z.object({
  fullName: fullNameField,
  gender: genderField,
  nationalCode: nationalCodeField,
  birthDate: birthDateField,
  beltId: beltIdField,
  weightKg: weightKgField.nullish(),
});

export const updateStudentSchema = z
  .object({
    fullName: fullNameField.optional(),
    gender: genderField.optional(),
    nationalCode: nationalCodeField.optional(),
    birthDate: birthDateField.optional(),
    beltId: beltIdField.optional(),
    weightKg: weightKgField.nullish(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "اطلاعاتی برای تغییر ارسال نشده است." });

export const studentListQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  beltId: z.string().min(1).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  coachId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const pendingReviewQuerySchema = z.object({
  status: z.enum(["PENDING", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const rejectProfileSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد پروفایل را بنویسید.").max(500, "یادداشت حداکثر ۵۰۰ نویسه است."),
});

export const studentDocumentTypeSchema = z.enum(["PHOTO", "NATIONAL_ID_OR_BIRTH_CERTIFICATE", "INSURANCE", "BELT_CERTIFICATE"]);

export type StudentFormValues = z.input<typeof studentSchema>;
export type CreateStudentInput = z.output<typeof createStudentSchema>;
export type UpdateStudentInput = z.output<typeof updateStudentSchema>;
export type StudentListQuery = z.output<typeof studentListQuerySchema>;
export type PendingReviewQuery = z.output<typeof pendingReviewQuerySchema>;
export type RejectProfileInput = z.output<typeof rejectProfileSchema>;

export const emptyStudentForm: StudentFormValues = {
  fullName: "",
  gender: "",
  nationalCode: "",
  birthDate: "",
  beltId: "",
  weightKg: "",
};
