import { z } from "zod";
import { provinceValues } from "@/lib/provinces";

export const rejectPaymentSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد را وارد کنید.").max(500, "دلیل رد حداکثر ۵۰۰ کاراکتر است."),
});

export type RejectPaymentValues = z.infer<typeof rejectPaymentSchema>;

export const paymentListQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED"]).optional(),
  competitionId: z.string().min(1).optional(),
  province: z.enum(provinceValues).optional(),
  coachId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type PaymentListQuery = z.output<typeof paymentListQuerySchema>;
