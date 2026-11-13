import { z } from "zod";
import { provinceValues } from "@/lib/provinces";

export const registrationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const registrationListQuerySchema = z.object({
  competitionId: z.string().min(1).optional(),
  paymentId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  province: z.enum(provinceValues).optional(),
  status: registrationStatusSchema.optional(),
  coachId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

function isValidWeight(value: number): boolean {
  return value > 0 && value <= 999.9 && /^\d+(\.\d)?$/.test(String(value));
}

export const createRegistrationsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "حداقل یک هنرجو را انتخاب کنید").max(50, "تعداد هنرجوهای انتخاب شده بیش از حد مجاز است"),
  weights: z.record(z.string(), z.number().refine(isValidWeight, "وزن وارد شده معتبر نیست")).optional(),
});

export const rejectRegistrationSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد را وارد کنید").max(500, "دلیل رد حداکثر ۵۰۰ کاراکتر است"),
});

export const weighInSchema = z.object({
  weightKg: z.number().refine(isValidWeight, "وزن وارد شده معتبر نیست"),
});

export const checkInSchema = z.object({
  checkedIn: z.boolean(),
});

export type RegistrationListQuery = z.output<typeof registrationListQuerySchema>;
export type CreateRegistrationsPayload = z.output<typeof createRegistrationsSchema>;
export type RejectRegistrationValues = z.infer<typeof rejectRegistrationSchema>;
export type WeighInPayload = z.output<typeof weighInSchema>;
export type CheckInPayload = z.output<typeof checkInSchema>;
