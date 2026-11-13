import { z } from "zod";

const codeField = z
  .string()
  .trim()
  .max(60, "کد حداکثر ۶۰ نویسه است")
  .regex(/^[a-z0-9_]+$/, "کد فقط می تواند شامل حروف کوچک انگلیسی، عدد و خط تیره پایین باشد")
  .optional();

const labelField = z.string().trim().min(2, "نام را وارد کنید").max(60, "نام حداکثر ۶۰ نویسه است");

const levelField = z
  .number()
  .int("سطح کمربند باید عدد صحیح باشد")
  .min(1, "سطح کمربند باید حداقل ۱ باشد")
  .max(99, "سطح کمربند حداکثر ۹۹ است");

const colorHexField = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "رنگ معتبر نیست")
  .nullable()
  .optional();

export const beltCreateSchema = z.object({
  code: codeField,
  label: labelField,
  level: levelField,
  rankType: z.enum(["COLOR", "POOM", "DAN"], { message: "نوع کمربند را انتخاب کنید" }),
  color: z.string().trim().max(30, "نام رنگ حداکثر ۳۰ نویسه است").nullable().optional(),
  colorHex: colorHexField,
});

export const beltUpdateSchema = z
  .object({
    label: labelField.optional(),
    level: levelField.optional(),
    rankType: z.enum(["COLOR", "POOM", "DAN"], { message: "نوع کمربند را انتخاب کنید" }).optional(),
    color: z.string().trim().max(30, "نام رنگ حداکثر ۳۰ نویسه است").nullable().optional(),
    colorHex: colorHexField,
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "اطلاعاتی برای تغییر ارسال نشده است" });

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime());
}

const startDateField = z.string().min(1, "تاریخ شروع را انتخاب کنید").refine(isIsoDate, "تاریخ شروع معتبر نیست");
const endDateField = z.string().min(1, "تاریخ پایان را انتخاب کنید").refine(isIsoDate, "تاریخ پایان معتبر نیست");

export const ageCategoryCreateSchema = z
  .object({
    code: codeField,
    label: labelField,
    startDate: startDateField,
    endDate: endDateField,
  })
  .refine((value) => new Date(value.endDate).getTime() > new Date(value.startDate).getTime(), {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
    path: ["endDate"],
  });

export const ageCategoryUpdateSchema = z
  .object({
    label: labelField.optional(),
    startDate: startDateField.optional(),
    endDate: endDateField.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "اطلاعاتی برای تغییر ارسال نشده است" })
  .refine(
    (value) =>
      value.startDate === undefined ||
      value.endDate === undefined ||
      new Date(value.endDate).getTime() > new Date(value.startDate).getTime(),
    {
      message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
      path: ["endDate"],
    },
  );

export const weightClassSetRowSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1, "برچسب رده وزنی را وارد کنید").max(30, "برچسب حداکثر ۳۰ نویسه است"),
  minWeightKg: z.number().min(0, "حداقل وزن نمی تواند منفی باشد"),
  maxWeightKg: z.number().min(0, "حداکثر وزن نمی تواند منفی باشد").nullable(),
  excludeMin: z.boolean(),
  excludeMax: z.boolean(),
});

export const weightClassSetSchema = z.object({
  ageCategoryId: z.string().min(1, "رده سنی را انتخاب کنید"),
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
  rows: z.array(weightClassSetRowSchema),
});

export type BeltCreateInput = z.output<typeof beltCreateSchema>;
export type BeltUpdateInput = z.output<typeof beltUpdateSchema>;
export type AgeCategoryCreateInput = z.output<typeof ageCategoryCreateSchema>;
export type AgeCategoryUpdateInput = z.output<typeof ageCategoryUpdateSchema>;
export type WeightClassSetInput = z.output<typeof weightClassSetSchema>;
