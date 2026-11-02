"use client";

import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

export const beltFormSchema = z.object({
  label: z.string().trim().min(2, "نام کمربند را وارد کنید.").max(60, "نام کمربند حداکثر ۶۰ نویسه است."),
  level: z
    .string()
    .transform(normalizeDigits)
    .pipe(
      z
        .string()
        .regex(/^\d+$/, "سطح کمربند را وارد کنید.")
        .refine((value) => Number(value) >= 1 && Number(value) <= 99, "سطح کمربند بین ۱ تا ۹۹ است."),
    ),
  rankType: z.enum(["COLOR", "POOM", "DAN"], { message: "نوع کمربند را انتخاب کنید." }),
  color: z.string().max(30, "نام رنگ حداکثر ۳۰ نویسه است."),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "کد رنگ معتبر نیست."),
});

export type BeltFormValues = {
  label: string;
  level: string;
  rankType: "COLOR" | "POOM" | "DAN";
  color: string;
  colorHex: string;
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export const ageCategoryFormSchema = z
  .object({
    label: z.string().trim().min(2, "نام رده سنی را وارد کنید.").max(60, "نام رده سنی حداکثر ۶۰ نویسه است."),
    startDate: z.string().min(1, "تاریخ شروع را انتخاب کنید.").refine(isIsoDate, "تاریخ شروع معتبر نیست."),
    endDate: z.string().min(1, "تاریخ پایان را انتخاب کنید.").refine(isIsoDate, "تاریخ پایان معتبر نیست."),
  })
  .refine((value) => new Date(value.endDate).getTime() > new Date(value.startDate).getTime(), {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
    path: ["endDate"],
  });

export type AgeCategoryFormValues = {
  label: string;
  startDate: string;
  endDate: string;
};
