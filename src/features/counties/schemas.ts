import { z } from "zod";
import { provinceValues } from "@/lib/provinces";

const countyNameField = z.string().trim().min(2, "نام شهرستان را وارد کنید.").max(80, "نام شهرستان حداکثر ۸۰ نویسه است.");

export const countyListQuerySchema = z.object({
  province: z.enum(provinceValues).optional(),
});

export const createCountySchema = z.object({
  province: z.enum(provinceValues, { message: "استان را انتخاب کنید." }),
  name: countyNameField,
});

export const countyFormSchema = z.object({
  province: z.string().min(1, "استان را انتخاب کنید."),
  name: countyNameField,
});

export const updateCountySchema = z.object({
  name: countyNameField,
});

export type CountyListQuery = z.output<typeof countyListQuerySchema>;
export type CountyFormValues = z.input<typeof countyFormSchema>;
export type CreateCountyInput = z.output<typeof createCountySchema>;
export type UpdateCountyInput = z.output<typeof updateCountySchema>;
