import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

function digitsField(message: string, pattern: RegExp) {
  return z.string().transform(normalizeDigits).pipe(z.string().regex(pattern, message));
}

export const createCoachSchema = z.object({
  fullName: z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید."),
  mobile: digitsField("شماره همراه باید ۱۱ رقم باشد و با ۰۹ شروع شود.", /^09\d{9}$/),
  nationalCode: digitsField("کد ملی باید ۱۰ رقم باشد.", /^\d{10}$/),
  initialPassword: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
});

export type CoachFormValues = z.input<typeof createCoachSchema>;
