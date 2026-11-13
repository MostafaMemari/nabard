import { z } from "zod";

const toLatinDigits = (value: string) =>
  value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const normalizeInput = (value: string) => toLatinDigits(value).trim();

export const loginSchema = z.object({
  mobile: z
    .string()
    .transform(normalizeInput)
    .pipe(z.string().regex(/^09\d{9}$/, "شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود")),
  password: z.string().transform(normalizeInput).pipe(z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید"),
  newPassword: z.string().min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
