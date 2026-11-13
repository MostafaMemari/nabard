import { z } from "zod";

export const createCountyChangeSchema = z.object({
  toCountyId: z.string().min(1, "شهرستان جدید را انتخاب کنید"),
});

export const approveCountyChangeSchema = z.object({});

export const rejectCountyChangeSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد درخواست را وارد کنید").max(500, "دلیل رد حداکثر ۵۰۰ نویسه است"),
});

export const countyChangeListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateCountyChangeInput = z.output<typeof createCountyChangeSchema>;
export type CreateCountyChangeValues = z.input<typeof createCountyChangeSchema>;
export type RejectCountyChangeInput = z.output<typeof rejectCountyChangeSchema>;
export type RejectCountyChangeValues = z.input<typeof rejectCountyChangeSchema>;
export type CountyChangeListQuery = z.output<typeof countyChangeListQuerySchema>;
