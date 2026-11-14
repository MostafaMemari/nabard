"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledDateField, ControlledSelectField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Belt } from "@/features/base-data";
import { updateRegistrationRequest } from "../api";
import { type StudentFormValues, studentSchema } from "../schemas";
import type { RegistrationRequest } from "../types";
import { tkdBankChargeYearItems } from "../year-items";

// The coach corrects a rejected (or pending) registration request; saving
// resubmits it for review with a clean slate.
export function RegistrationRequestEditDialog({
  request,
  belts,
  open,
  onOpenChange,
  onSaved,
}: {
  request: RegistrationRequest;
  belts: Belt[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<unknown>;
}) {
  const form = useForm<StudentFormValues, unknown, StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: request.fullName,
      nationalCode: request.nationalCode,
      birthDate: request.birthDate,
      mobile: request.mobile ?? "",
      beltId: request.beltId,
      beltCertificateDate: request.beltCertificateDate ?? "",
      insuranceDate: request.insuranceDate ?? "",
      tkdBankChargeYear: request.tkdBankChargeYear !== null ? String(request.tkdBankChargeYear) : "",
    },
  });
  const beltItems = Object.fromEntries(belts.filter((belt) => belt.isActive).map((belt) => [belt.id, belt.label]));

  async function submit(values: StudentFormValues) {
    try {
      await updateRegistrationRequest(request.id, {
        fullName: values.fullName.trim(),
        nationalCode: values.nationalCode,
        birthDate: values.birthDate,
        mobile: values.mobile,
        beltId: values.beltId,
        beltCertificateDate: values.beltCertificateDate,
        insuranceDate: values.insuranceDate,
        tkdBankChargeYear: values.tkdBankChargeYear,
      });
      toast.success("درخواست اصلاح شد و دوباره برای بررسی به ادمین استان ارسال شد");
      await onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ویرایش درخواست «{request.fullName}»</DialogTitle>
          <DialogDescription>
            اطلاعات را اصلاح کنید؛ با ذخیره، درخواست دوباره با وضعیت در انتظار تأیید برای ادمین استان ارسال می شود
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField control={form.control} name="fullName" label="نام و نام خانوادگی" autoComplete="off" />
          <ControlledTextField
            control={form.control}
            name="nationalCode"
            label="کد ملی"
            inputMode="numeric"
            dir="ltr"
            placeholder="۰۰۱۲۳۴۵۶۷۸۹"
            spellCheck={false}
            autoComplete="off"
          />
          <ControlledTextField
            control={form.control}
            name="mobile"
            label="تلفن همراه"
            inputMode="numeric"
            dir="ltr"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            autoComplete="off"
          />
          <ControlledDateField control={form.control} name="birthDate" label="تاریخ تولد" variant="birth" />
          <ControlledSelectField control={form.control} name="beltId" label="کمربند" placeholder="انتخاب کمربند" items={beltItems} />
          <ControlledDateField control={form.control} name="beltCertificateDate" label="تاریخ حکم کمربند (اختیاری)" />
          <ControlledDateField control={form.control} name="insuranceDate" label="تاریخ بیمه ورزشی (اختیاری)" />
          <ControlledSelectField
            control={form.control}
            name="tkdBankChargeYear"
            label="سال شارژ بانک اطلاعات تکواندو (اختیاری)"
            placeholder="انتخاب سال"
            items={tkdBankChargeYearItems}
          />
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره و ارسال مجدد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
