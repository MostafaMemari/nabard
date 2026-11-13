"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledSelectField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/http";
import { type BeltAdmin, createBelt, updateBelt } from "../api-admin";
import { type BeltFormValues, beltFormSchema } from "../schemas-forms";

const rankTypeItems = { COLOR: "رنگی", POOM: "پوم", DAN: "دان" };

export function BeltFormDialog({
  open,
  onOpenChange,
  onSaved,
  belt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  belt: BeltAdmin | null;
}) {
  const isEdit = belt !== null;
  const form = useForm<BeltFormValues, unknown, BeltFormValues>({
    resolver: zodResolver(beltFormSchema),
    defaultValues: { label: "", level: "", rankType: "COLOR", color: "", colorHex: "#18181b" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        label: belt?.label ?? "",
        level: belt ? String(belt.level) : "",
        rankType: belt?.rankType ?? "COLOR",
        color: belt?.color ?? "",
        colorHex: belt?.colorHex ?? "#18181b",
      });
    }
  }, [open, belt, form]);

  async function submit(values: BeltFormValues) {
    try {
      if (isEdit && belt) {
        await updateBelt(belt.id, {
          label: values.label.trim(),
          level: Number(values.level),
          rankType: values.rankType,
          color: values.color.trim() === "" ? null : values.color.trim(),
          colorHex: values.colorHex,
        });
        toast.success("کمربند ذخیره شد.");
      } else {
        await createBelt({
          label: values.label.trim(),
          level: Number(values.level),
          rankType: values.rankType,
          color: values.color.trim() === "" ? null : values.color.trim(),
          colorHex: values.colorHex,
        });
        toast.success("کمربند اضافه شد.");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش کمربند" : "کمربند جدید"}</DialogTitle>
          <DialogDescription>نام و سطح کمربند را وارد کنید؛ سطح ها باید یکتا باشند.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField control={form.control} name="label" label="نام کمربند" placeholder="مثلاً سبز با یک نوار" />
          <ControlledTextField control={form.control} name="level" label="سطح" inputMode="numeric" />
          <ControlledSelectField control={form.control} name="rankType" label="نوع" items={rankTypeItems} />
          <ControlledTextField control={form.control} name="color" label="نام رنگ (اختیاری)" placeholder="مثلاً سبز" />
          <ControlledTextField control={form.control} name="colorHex" label="کد رنگ" placeholder="#16a34a" />
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
