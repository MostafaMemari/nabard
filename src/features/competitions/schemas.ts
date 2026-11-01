import { z } from "zod";
import { normalizeDigits } from "@/lib/format";

export const competitionSchema = z
  .object({
    title: z.string().trim().min(3, "عنوان مسابقه باید حداقل ۳ حرف باشد."),
    discipline: z.string().min(1, "رشته را انتخاب کنید."),
    gender: z.string().min(1, "جنسیت را انتخاب کنید."),
    ageCategoryId: z.string().min(1, "رده سنی را انتخاب کنید."),
    beltIds: z.array(z.string()).min(1, "حداقل یک کمربند را انتخاب کنید."),
    feePerStudent: z
      .string()
      .transform(normalizeDigits)
      .pipe(z.string().refine((value) => value !== "" && Number(value) > 0, "هزینه هر هنرجو را به ریال وارد کنید.")),
    payeeCardNumber: z.string().transform(normalizeDigits).pipe(z.string().length(16, "شماره کارت باید ۱۶ رقم باشد.")),
    payeeCardHolder: z.string().trim().min(3, "نام صاحب کارت را وارد کنید."),
    registrationDeadline: z.string().min(1, "مهلت ثبت نام را انتخاب کنید."),
    eventDate: z.string().min(1, "تاریخ برگزاری را انتخاب کنید."),
  })
  .refine((data) => data.eventDate > data.registrationDeadline, {
    message: "تاریخ برگزاری باید بعد از مهلت ثبت نام باشد.",
    path: ["eventDate"],
  });

export type CompetitionFormValues = {
  title: string;
  discipline: string;
  gender: string;
  ageCategoryId: string;
  beltIds: string[];
  feePerStudent: string;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: string;
  eventDate: string;
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime());
}

const titleField = z.string().trim().min(3, "عنوان مسابقه باید حداقل ۳ حرف باشد.");
const disciplineField = z.enum(["KYORUGI", "POOMSAE"], { message: "رشته را انتخاب کنید." });
const genderField = z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید." });
const ageCategoryField = z.string().min(1, "رده سنی را انتخاب کنید.");
const beltIdsField = z.array(z.string().min(1)).min(1, "حداقل یک کمربند را انتخاب کنید.");
const feeField = z
  .string()
  .transform(normalizeDigits)
  .pipe(
    z
      .string()
      .regex(/^\d+$/, "هزینه هر هنرجو را به ریال وارد کنید.")
      .refine((value) => Number(value) > 0, "هزینه هر هنرجو باید عددی مثبت باشد."),
  );
const payeeCardNumberField = z
  .string()
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^\d{16}$/, "شماره کارت باید ۱۶ رقم باشد."));
const payeeCardHolderField = z.string().trim().min(3, "نام صاحب کارت را وارد کنید.");
const registrationDeadlineField = z.string().min(1, "مهلت ثبت نام را انتخاب کنید.").refine(isIsoDate, "مهلت ثبت نام معتبر نیست.");
const eventDateField = z.string().min(1, "تاریخ برگزاری را انتخاب کنید.").refine(isIsoDate, "تاریخ برگزاری معتبر نیست.");

export const createCompetitionSchema = z.object({
  title: titleField,
  discipline: disciplineField,
  gender: genderField,
  ageCategoryId: ageCategoryField,
  beltIds: beltIdsField,
  feePerStudent: feeField,
  payeeCardNumber: payeeCardNumberField,
  payeeCardHolder: payeeCardHolderField,
  registrationDeadline: registrationDeadlineField,
  eventDate: eventDateField,
});

export const updateCompetitionSchema = z
  .object({
    title: titleField.optional(),
    discipline: disciplineField.optional(),
    gender: genderField.optional(),
    ageCategoryId: ageCategoryField.optional(),
    beltIds: beltIdsField.optional(),
    feePerStudent: feeField.optional(),
    payeeCardNumber: payeeCardNumberField.optional(),
    payeeCardHolder: payeeCardHolderField.optional(),
    registrationDeadline: registrationDeadlineField.optional(),
    eventDate: eventDateField.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "اطلاعاتی برای تغییر ارسال نشده است." });

export const cancelCompetitionSchema = z.object({
  reason: z.string().trim().min(3, "دلیل لغو مسابقه را وارد کنید.").max(500, "دلیل لغو حداکثر ۵۰۰ نویسه است."),
});

export const extendCompetitionSchema = z.object({
  newDeadline: z.string().min(1, "مهلت جدید را انتخاب کنید.").refine(isIsoDate, "مهلت جدید معتبر نیست."),
  reason: z.string().trim().min(3, "دلیل تمدید مهلت را وارد کنید.").max(500, "دلیل تمدید حداکثر ۵۰۰ نویسه است."),
  reopenForRejected: z.boolean().optional(),
});

export const competitionListQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELED"]).optional(),
  discipline: z.enum(["KYORUGI", "POOMSAE"]).optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateCompetitionInput = z.output<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.output<typeof updateCompetitionSchema>;
export type CompetitionListQuery = z.output<typeof competitionListQuerySchema>;

export const emptyCompetitionForm: CompetitionFormValues = {
  title: "",
  discipline: "",
  gender: "",
  ageCategoryId: "",
  beltIds: [],
  feePerStudent: "",
  payeeCardNumber: "",
  payeeCardHolder: "",
  registrationDeadline: "",
  eventDate: "",
};
