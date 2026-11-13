import { z } from "zod";
import { provinceValues } from "@/lib/provinces";

export const createProvinceChangeSchema = z.object({
  toProvince: z.string().min(1, "استان مقصد را انتخاب کنید").pipe(z.enum(provinceValues)),
  toCoachId: z.string().min(1, "مربی مقصد را انتخاب کنید"),
});

export const provinceChangeListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const rejectProvinceChangeSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد درخواست را وارد کنید").max(500, "دلیل رد حداکثر ۵۰۰ نویسه است"),
});

export type CreateProvinceChangeInput = z.output<typeof createProvinceChangeSchema>;
export type CreateProvinceChangeValues = z.input<typeof createProvinceChangeSchema>;
export type ProvinceChangeListQuery = z.output<typeof provinceChangeListQuerySchema>;
export type RejectProvinceChangeInput = z.output<typeof rejectProvinceChangeSchema>;
export type RejectProvinceChangeValues = z.input<typeof rejectProvinceChangeSchema>;
