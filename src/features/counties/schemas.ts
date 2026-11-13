import { z } from "zod";
import { provinceValues } from "@/lib/provinces";

const countyNameField = z.string().trim().min(2, "نام شهرستان را وارد کنید").max(80, "نام شهرستان حداکثر ۸۰ نویسه است");

export const countyListQuerySchema = z.object({
  province: z.enum(provinceValues).optional(),
});

export const createCountySchema = z.object({
  province: z.enum(provinceValues).optional(),
  name: countyNameField,
});

export const updateCountySchema = z.object({
  name: countyNameField,
});

export const countyNameFormSchema = z.object({ name: countyNameField });

export type CountyListQuery = z.output<typeof countyListQuerySchema>;
export type CreateCountyInput = z.output<typeof createCountySchema>;
export type UpdateCountyInput = z.output<typeof updateCountySchema>;
export type CountyNameFormValues = z.input<typeof countyNameFormSchema>;

export function normalizeCountyName(name: string): string {
  return name
    .replace(/\u200c/g, "")
    .replace(/\s+/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .trim();
}
