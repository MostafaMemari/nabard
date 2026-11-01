import { z } from "zod";

export const ageCategoryDatesSchema = z
  .object({
    startDate: z.string().min(1, "تاریخ شروع را انتخاب کنید."),
    endDate: z.string().min(1, "تاریخ پایان را انتخاب کنید."),
  })
  .refine((value) => new Date(value.endDate).getTime() > new Date(value.startDate).getTime(), {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
    path: ["endDate"],
  });

export type AgeCategoryDatesInput = z.output<typeof ageCategoryDatesSchema>;

export type AgeCategoryDatesValues = z.input<typeof ageCategoryDatesSchema>;
