import { z } from "zod";
import { normalizeDigits } from "@/lib/format";
import { provinceValues } from "@/lib/provinces";

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function isPastIsoDate(value: string): boolean {
  return isIsoDate(value) && new Date(value).getTime() < Date.now();
}

const fullNameField = z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید");
const nationalCodeField = z
  .string()
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد"));
const birthDateField = z.string().min(1, "تاریخ تولد را انتخاب کنید").refine(isPastIsoDate, "تاریخ تولد باید یک تاریخ گذشته و معتبر باشد");
const optionalDateField = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().refine((value) => value === "" || isIsoDate(value), "تاریخ انتخاب شده معتبر نیست"));
const beltIdField = z.string().min(1, "کمربند را انتخاب کنید");
const mobileField = z
  .string()
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^09\d{9}$/, "شماره همراه باید ۱۱ رقم و با ۰۹ شروع شود"));

export const studentSchema = z.object({
  fullName: fullNameField,
  nationalCode: nationalCodeField,
  birthDate: birthDateField,
  mobile: mobileField,
  beltId: beltIdField,
  beltCertificateDate: optionalDateField,
  insuranceDate: optionalDateField,
  tkdBankChargeDate: optionalDateField,
});

export const createStudentSchema = studentSchema;

export const updateStudentBeltSchema = z.object({
  beltId: beltIdField,
});

export const studentListQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  beltId: z.string().min(1).optional(),
  province: z.enum(provinceValues).optional(),
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
  note: z.string().trim().min(3, "دلیل رد پروفایل را بنویسید").max(500, "یادداشت حداکثر ۵۰۰ نویسه است"),
});

export const studentDocumentTypeSchema = z.enum(["PHOTO", "NATIONAL_ID_OR_BIRTH_CERTIFICATE", "INSURANCE"]);

export type StudentFormValues = z.input<typeof studentSchema>;
export type CreateStudentInput = z.output<typeof createStudentSchema>;
export type UpdateStudentBeltInput = z.output<typeof updateStudentBeltSchema>;
export type StudentListQuery = z.output<typeof studentListQuerySchema>;
export type PendingReviewQuery = z.output<typeof pendingReviewQuerySchema>;
export type RejectProfileInput = z.output<typeof rejectProfileSchema>;

export const emptyStudentForm: StudentFormValues = {
  fullName: "",
  nationalCode: "",
  birthDate: "",
  mobile: "",
  beltId: "",
  beltCertificateDate: "",
  insuranceDate: "",
  tkdBankChargeDate: "",
};
