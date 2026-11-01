import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

function digitsField(message: string, pattern: RegExp) {
  return z.string().transform(normalizeDigits).pipe(z.string().regex(pattern, message));
}

const fullNameField = z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.");
const mobileField = digitsField("شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود.", /^09\d{9}$/);
const nationalCodeField = digitsField("کد ملی باید ۱۰ رقم باشد.", /^\d{10}$/);
const passwordField = z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.");

export const createCoachSchema = z.object({
  fullName: fullNameField,
  mobile: mobileField,
  nationalCode: nationalCodeField,
  initialPassword: passwordField,
});

export const updateCoachSchema = z
  .object({
    fullName: fullNameField.optional(),
    mobile: mobileField.optional(),
    nationalCode: nationalCodeField.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "اطلاعاتی برای تغییر ارسال نشده است." });

export const resetCoachPasswordSchema = z.object({
  password: passwordField,
});

export const coachListQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CoachFormValues = z.input<typeof createCoachSchema>;
export type CoachInput = z.output<typeof createCoachSchema>;
export type UpdateCoachInput = z.output<typeof updateCoachSchema>;
export type CoachListQuery = z.output<typeof coachListQuerySchema>;
export type ResetCoachPasswordInput = z.output<typeof resetCoachPasswordSchema>;
