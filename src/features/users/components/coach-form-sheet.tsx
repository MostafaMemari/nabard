"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCounties } from "@/features/counties";
import { createCoach } from "../api";
import { type CoachFormValues, createCoachSchema } from "../schemas";
import { CoachSelectField, CoachTextField } from "./coach-form-fields";

// gender starts as "" so the select shows its placeholder until the admin picks one.
const emptyForm = {
  fullName: "",
  mobile: "",
  nationalCode: "",
  initialPassword: "",
  countyId: "",
  gender: "",
} as unknown as CoachFormValues;

const genderItems = { MALE: "مرد", FEMALE: "زن" };

export function CoachFormSheet({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const form = useForm<CoachFormValues, unknown, CoachFormValues>({
    resolver: zodResolver(createCoachSchema),
    defaultValues: emptyForm,
  });
  const { counties } = useCounties();
  const countyItems = Object.fromEntries(counties.map((county) => [county.id, county.name]));

  async function submit(values: CoachFormValues) {
    try {
      await createCoach({
        fullName: values.fullName.trim(),
        mobile: values.mobile,
        nationalCode: values.nationalCode,
        initialPassword: values.initialPassword,
        countyId: values.countyId,
        gender: values.gender,
      });
      toast.success("مربی اضافه شد.");
      form.reset(emptyForm);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-6 sm:max-w-md">
        <SheetHeader className="p-0">
          <SheetTitle>مربی جدید</SheetTitle>
          <SheetDescription>اطلاعات مربی را وارد کنید؛ حساب به صورت فعال ساخته می شود.</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-6 flex flex-col gap-4">
          <CoachTextField control={form.control} name="fullName" label="نام و نام خانوادگی" placeholder="مثلاً رضا محمدی" />
          <CoachTextField
            control={form.control}
            name="mobile"
            label="شماره همراه"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          />
          <CoachTextField
            control={form.control}
            name="nationalCode"
            label="کد ملی"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            placeholder="۰۰۱۲۳۴۵۶۷۸۹"
          />
          <CoachSelectField control={form.control} name="countyId" label="شهرستان" items={countyItems} />
          <CoachSelectField control={form.control} name="gender" label="جنسیت" items={genderItems} />
          <CoachTextField
            control={form.control}
            name="initialPassword"
            label="رمز عبور اولیه"
            type="password"
            placeholder="حداقل ۸ کاراکتر"
          />
          <div className="mt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
