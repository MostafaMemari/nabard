"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledSelectField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { provinceLabels, provinceValues } from "@/lib/provinces";
import { updateAdmin } from "../api";
import { type EditAdminFormValues, editAdminFormSchema } from "../schemas";
import type { AdminUser } from "../types";

export function AdminEditSheet({
  admin,
  onOpenChange,
  onSaved,
}: {
  admin: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const form = useForm<EditAdminFormValues, unknown, EditAdminFormValues>({
    resolver: zodResolver(editAdminFormSchema),
    defaultValues: { fullName: "", mobile: "", province: "" },
  });
  const provinceItems = Object.fromEntries(provinceValues.map((province) => [province, provinceLabels[province]]));

  useEffect(() => {
    if (admin) {
      form.reset({ fullName: admin.fullName, mobile: admin.mobile, province: admin.province });
    }
  }, [admin, form]);

  async function submit(values: EditAdminFormValues) {
    if (!admin) return;
    try {
      await updateAdmin(admin.id, {
        fullName: values.fullName.trim(),
        mobile: values.mobile,
        province: values.province as AdminUser["province"],
      });
      toast.success("تغییرات ادمین استان ذخیره شد.");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <Sheet open={admin !== null} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-6 sm:max-w-md">
        <SheetHeader className="p-0">
          <SheetTitle>ویرایش ادمین استان</SheetTitle>
          <SheetDescription>اطلاعات «{admin?.fullName}» را ویرایش کنید.</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-6 flex flex-col gap-4">
          <ControlledTextField control={form.control} name="fullName" label="نام و نام خانوادگی" />
          <ControlledTextField control={form.control} name="mobile" label="شماره همراه" inputMode="numeric" dir="ltr" autoComplete="off" />
          <ControlledSelectField control={form.control} name="province" label="استان" items={provinceItems} />
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
