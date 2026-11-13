"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledSelectField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { provinceLabels, provinceValues } from "@/lib/provinces";
import { createAdmin } from "../api";
import { type AdminFormValues, createAdminFormSchema } from "../schemas";
import type { AdminUser } from "../types";

const emptyForm: AdminFormValues = { fullName: "", mobile: "", initialPassword: "", province: "" };

export function AdminCreateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const form = useForm<AdminFormValues, unknown, AdminFormValues>({
    resolver: zodResolver(createAdminFormSchema),
    defaultValues: emptyForm,
  });
  const provinceItems = Object.fromEntries(provinceValues.map((province) => [province, provinceLabels[province]]));

  async function submit(values: AdminFormValues) {
    try {
      await createAdmin({
        fullName: values.fullName.trim(),
        mobile: values.mobile,
        initialPassword: values.initialPassword,
        province: values.province as AdminUser["province"],
      });
      toast.success("ادمین استان اضافه شد");
      form.reset(emptyForm);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ادمین استان جدید</DialogTitle>
          <DialogDescription>اطلاعات ادمین استان را وارد کنید؛ حساب به صورت فعال ساخته می شود</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField control={form.control} name="fullName" label="نام و نام خانوادگی" placeholder="مثلاً سارا احمدی" />
          <ControlledTextField
            control={form.control}
            name="mobile"
            label="شماره همراه"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          />
          <ControlledSelectField control={form.control} name="province" label="استان" items={provinceItems} />
          <ControlledTextField
            control={form.control}
            name="initialPassword"
            label="رمز عبور اولیه"
            type="password"
            placeholder="حداقل ۸ کاراکتر"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
