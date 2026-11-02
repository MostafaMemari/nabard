"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createCounty, updateCounty } from "../api";
import { type CountyNameFormValues, countyNameFormSchema } from "../schemas";
import type { County } from "../types";

export function CountyFormSheet({
  open,
  onOpenChange,
  onSaved,
  county,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  county: County | null;
}) {
  const isEdit = county !== null;
  const form = useForm<CountyNameFormValues, unknown, CountyNameFormValues>({
    resolver: zodResolver(countyNameFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) form.reset({ name: county?.name ?? "" });
  }, [open, county, form]);

  async function submit(values: CountyNameFormValues) {
    try {
      if (isEdit && county) {
        await updateCounty(county.id, { name: values.name.trim() });
        toast.success("نام شهرستان ذخیره شد.");
      } else {
        await createCounty({ name: values.name.trim() });
        toast.success("شهرستان اضافه شد.");
      }
      form.reset({ name: "" });
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
          <SheetTitle>{isEdit ? "ویرایش شهرستان" : "شهرستان جدید"}</SheetTitle>
          <SheetDescription>{isEdit ? "نام شهرستان را ویرایش کنید." : "نام شهرستان استان خود را وارد کنید."}</SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-6 flex flex-col gap-4">
          <ControlledTextField control={form.control} name="name" label="نام شهرستان" placeholder="مثلاً ورامین" />
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
