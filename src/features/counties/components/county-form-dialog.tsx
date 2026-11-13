"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCounty, updateCounty } from "../api";
import { type CountyNameFormValues, countyNameFormSchema } from "../schemas";
import type { County } from "../types";

export function CountyFormDialog({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش شهرستان" : "شهرستان جدید"}</DialogTitle>
          <DialogDescription>{isEdit ? "نام شهرستان را ویرایش کنید." : "نام شهرستان استان خود را وارد کنید."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField control={form.control} name="name" label="نام شهرستان" placeholder="مثلاً ورامین" />
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
