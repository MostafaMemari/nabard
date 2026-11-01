"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledSelectField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { provinceLabels, provinceValues } from "@/lib/provinces";
import { createCounty, updateCounty } from "../api";
import { type CountyFormValues, countyFormSchema } from "../schemas";
import type { County } from "../types";

const emptyForm: CountyFormValues = { province: "", name: "" };

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
  const form = useForm<CountyFormValues, unknown, CountyFormValues>({
    resolver: zodResolver(countyFormSchema),
    defaultValues: emptyForm,
  });
  const provinceItems = Object.fromEntries(provinceValues.map((province) => [province, provinceLabels[province]]));

  useEffect(() => {
    if (open && county) {
      form.reset({ province: county.province, name: county.name });
    }
    if (open && !county) {
      form.reset(emptyForm);
    }
  }, [open, county, form]);

  async function submit(values: CountyFormValues) {
    try {
      if (isEdit && county) {
        await updateCounty(county.id, { name: values.name.trim() });
        toast.success("نام شهرستان ذخیره شد.");
      } else {
        await createCounty({ province: values.province as County["province"], name: values.name.trim() });
        toast.success("شهرستان اضافه شد.");
      }
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
          <SheetTitle>{isEdit ? "ویرایش شهرستان" : "شهرستان جدید"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "نام شهرستان را ویرایش کنید؛ استان آن قابل تغییر نیست." : "استان و نام شهرستان را وارد کنید."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="mt-6 flex flex-col gap-4">
          {isEdit ? (
            <Field>
              <FieldLabel htmlFor="province-display">استان</FieldLabel>
              <Input id="province-display" value={county ? provinceLabels[county.province] : ""} disabled />
            </Field>
          ) : (
            <ControlledSelectField control={form.control} name="province" label="استان" items={provinceItems} />
          )}
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
