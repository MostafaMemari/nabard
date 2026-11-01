import { z } from "zod";

const toAsciiDigits = (value: string) => value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

export const loginSchema = z.object({
  mobile: z
    .string()
    .transform(toAsciiDigits)
    .pipe(z.string().regex(/^09\d{9}$/, "شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود.")),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
});

export type LoginInput = z.infer<typeof loginSchema>;
