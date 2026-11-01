import { z } from "zod";

export const registrationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const registrationListQuerySchema = z.object({
  competitionId: z.string().min(1).optional(),
  paymentId: z.string().min(1).optional(),
  status: registrationStatusSchema.optional(),
  coachId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const createRegistrationsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "حداقل یک هنرجو را انتخاب کنید.").max(50, "تعداد هنرجوهای انتخاب شده بیش از حد مجاز است."),
});

export const updateRegistrationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], { message: "وضعیت ثبت نام را مشخص کنید." }),
  note: z.string().trim().max(500, "توضیح حداکثر ۵۰۰ کاراکتر است.").optional(),
});

export type RegistrationListQuery = z.output<typeof registrationListQuerySchema>;
export type CreateRegistrationsPayload = z.output<typeof createRegistrationsSchema>;
export type UpdateRegistrationInput = z.output<typeof updateRegistrationSchema>;
