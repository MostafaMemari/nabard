import { z } from "zod";
import { normalizeDigits } from "@/lib/format";
import { provinceValues } from "@/lib/provinces";

function digitsField(message: string, pattern: RegExp) {
  return z.string().transform(normalizeDigits).pipe(z.string().regex(pattern, message));
}

const fullNameField = z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.");
const mobileField = digitsField("شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود.", /^09\d{9}$/);
const passwordField = z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.");

export const createAdminSchema = z.object({
  fullName: fullNameField,
  mobile: mobileField,
  initialPassword: passwordField,
  province: z.enum(provinceValues, { message: "استان را انتخاب کنید." }),
});

export const createAdminFormSchema = z.object({
  fullName: fullNameField,
  mobile: mobileField,
  initialPassword: passwordField,
  province: z.string().min(1, "استان را انتخاب کنید."),
});

export const editAdminFormSchema = z.object({
  fullName: fullNameField,
  mobile: mobileField,
  province: z.string().min(1, "استان را انتخاب کنید."),
});

export const updateAdminSchema = z
  .object({
    fullName: fullNameField.optional(),
    mobile: mobileField.optional(),
    province: z.enum(provinceValues).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "اطلاعاتی برای تغییر ارسال نشده است." });

export const resetAdminPasswordSchema = z.object({
  password: passwordField,
});

export const adminListQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type AdminFormValues = z.input<typeof createAdminFormSchema>;
export type CreateAdminInput = z.output<typeof createAdminSchema>;
export type EditAdminFormValues = z.input<typeof editAdminFormSchema>;
export type UpdateAdminInput = z.output<typeof updateAdminSchema>;
export type ResetAdminPasswordInput = z.output<typeof resetAdminPasswordSchema>;
export type AdminListQuery = z.output<typeof adminListQuerySchema>;
