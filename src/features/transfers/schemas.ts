import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

const nationalCodeField = z
  .string()
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد."));

export const transferLookupSchema = z.object({
  nationalCode: nationalCodeField,
});

export const createTransferRequestSchema = z.object({
  nationalCode: nationalCodeField,
});

export const createCoachChangeSchema = z.object({
  toCoachId: z.string().min(1, "مربی مقصد را انتخاب کنید."),
});

export const approveTransferSchema = z.object({});

export const rejectTransferSchema = z.object({
  note: z.string().trim().min(3, "دلیل رد درخواست را وارد کنید.").max(500, "دلیل رد حداکثر ۵۰۰ نویسه است."),
});

export const reassignStudentsSchema = z.object({
  toCoachId: z.string().min(1, "مربی مقصد را انتخاب کنید."),
});

export const transferListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type TransferLookupInput = z.output<typeof transferLookupSchema>;
export type CreateTransferRequestInput = z.output<typeof createTransferRequestSchema>;
export type CreateCoachChangeInput = z.output<typeof createCoachChangeSchema>;
export type CreateCoachChangeValues = z.input<typeof createCoachChangeSchema>;
export type RejectTransferInput = z.output<typeof rejectTransferSchema>;
export type RejectTransferValues = z.input<typeof rejectTransferSchema>;
export type ReassignStudentsInput = z.output<typeof reassignStudentsSchema>;
export type TransferListQuery = z.output<typeof transferListQuerySchema>;
