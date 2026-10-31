import { z } from "zod";

export const rejectPaymentSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد را وارد کنید.").max(500, "دلیل رد حداکثر ۵۰۰ کاراکتر است."),
});

export type RejectPaymentValues = z.infer<typeof rejectPaymentSchema>;
