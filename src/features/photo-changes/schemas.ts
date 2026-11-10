import { z } from "zod";

export const photoChangeListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const rejectPhotoChangeSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد درخواست را وارد کنید.").max(500, "دلیل رد حداکثر ۵۰۰ نویسه است."),
});

export type PhotoChangeListQuery = z.output<typeof photoChangeListQuerySchema>;
export type RejectPhotoChangeInput = z.output<typeof rejectPhotoChangeSchema>;
export type RejectPhotoChangeValues = z.input<typeof rejectPhotoChangeSchema>;
