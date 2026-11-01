import { z } from "zod";

export const completeRefundSchema = z.object({
  note: z.string().trim().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر است.").optional(),
});

export type CompleteRefundValues = z.infer<typeof completeRefundSchema>;

export const refundListQuerySchema = z.object({
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type RefundListQuery = z.output<typeof refundListQuerySchema>;
