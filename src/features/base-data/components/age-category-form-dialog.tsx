"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledDateField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/http";
import { type AgeCategoryAdmin, createAgeCategory, updateAgeCategory } from "../api-admin";
import { type AgeCategoryFormValues, ageCategoryFormSchema } from "../schemas-forms";

export function AgeCategoryFormDialog({
  open,
  onOpenChange,
  onSaved,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  category: AgeCategoryAdmin | null;
}) {
  const isEdit = category !== null;
  const form = useForm<AgeCategoryFormValues, unknown, AgeCategoryFormValues>({
    resolver: zodResolver(ageCategoryFormSchema),
    defaultValues: { label: "", startDate: "", endDate: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        label: category?.label ?? "",
        startDate: category?.startDate ?? "",
        endDate: category?.endDate ?? "",
      });
    }
  }, [open, category, form]);

  async function submit(values: AgeCategoryFormValues) {
    try {
      if (isEdit && category) {
        await updateAgeCategory(category.id, {
          label: values.label.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
        });
        toast.success("رده سنی ذخیره شد. سال های تولد از تاریخ ها محاسبه شد.");
      } else {
        await createAgeCategory({
          label: values.label.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
        });
        toast.success("رده سنی اضافه شد.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("endDate", { message: error.message });
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش رده سنی" : "رده سنی جدید"}</DialogTitle>
          <DialogDescription>بازه تاریخ تولد را وارد کنید؛ سال های تولد به صورت خودکار محاسبه می شوند.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField control={form.control} name="label" label="نام رده سنی" placeholder="مثلاً بزرگسال" />
          <ControlledDateField control={form.control} name="startDate" label="تاریخ شروع تولد" variant="birth" />
          <ControlledDateField control={form.control} name="endDate" label="تاریخ پایان تولد" variant="birth" />
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
