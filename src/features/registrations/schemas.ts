import { z } from "zod";
import { provinceValues } from "@/lib/provinces";

export const registrationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const registrationListQuerySchema = z.object({
  competitionId: z.string().min(1).optional(),
  paymentId: z.string().min(1).optional(),
  province: z.enum(provinceValues).optional(),
  status: registrationStatusSchema.optional(),
  coachId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const createRegistrationsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "حداقل یک هنرجو را انتخاب کنید.").max(50, "تعداد هنرجوهای انتخاب شده بیش از حد مجاز است."),
});

export const rejectRegistrationSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد را وارد کنید.").max(500, "دلیل رد حداکثر ۵۰۰ کاراکتر است."),
});

export type RegistrationListQuery = z.output<typeof registrationListQuerySchema>;
export type CreateRegistrationsPayload = z.output<typeof createRegistrationsSchema>;
export type RejectRegistrationValues = z.infer<typeof rejectRegistrationSchema>;
