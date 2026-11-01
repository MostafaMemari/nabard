"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledDateField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateAgeCategoryDates } from "../api-admin";
import { ageCategoryLabels } from "../labels";
import { type AgeCategoryDatesValues, ageCategoryDatesSchema } from "../schemas";
import type { AgeCategory } from "../types";

export function AgeCategoryDatesDialog({
  category,
  onDone,
  onClose,
}: {
  category: AgeCategory | null;
  onDone: () => void;
  onClose: () => void;
}) {
  const form = useForm<AgeCategoryDatesValues, unknown, AgeCategoryDatesValues>({
    resolver: zodResolver(ageCategoryDatesSchema),
    defaultValues: { startDate: "", endDate: "" },
  });

  useEffect(() => {
    if (category) {
      form.reset({ startDate: category.startDate, endDate: category.endDate });
    }
  }, [category, form]);

  async function submit(values: AgeCategoryDatesValues) {
    if (!category) return;
    try {
      await updateAgeCategoryDates(category.id, values);
      toast.success("بازه تاریخ رده سنی ذخیره شد.");
      onDone();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <Dialog
      open={category !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ویرایش بازه تاریخ رده «{category ? ageCategoryLabels[category.name] : ""}»</DialogTitle>
          <DialogDescription>
            بازه سنی بر اساس تاریخ تولد هنرجوها محاسبه می شود. اگر برای این رده سنی در مسابقه منتشر شده ثبت نام انجام شده باشد، ذخیره انجام
            نمی شود.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledDateField control={form.control} name="startDate" label="تاریخ شروع" />
          <ControlledDateField control={form.control} name="endDate" label="تاریخ پایان" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
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
