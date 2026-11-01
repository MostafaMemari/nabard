"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { RejectPaymentValues } from "../schemas";
import { rejectPaymentSchema } from "../schemas";

export function PaymentRejectDialog({
  open,
  onOpenChange,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onConfirm: (note: string) => Promise<void>;
}) {
  const form = useForm<RejectPaymentValues, unknown, RejectPaymentValues>({
    resolver: zodResolver(rejectPaymentSchema),
    defaultValues: { note: "" },
  });

  async function submit(values: RejectPaymentValues) {
    await onConfirm(values.note.trim());
    form.reset({ note: "" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset({ note: "" });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>رد رسید</DialogTitle>
          <DialogDescription>دلیل رد برای مربی نمایش داده می شود تا بتواند رسید جدیدی بارگذاری کند.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={form.formState.errors.note ? "" : undefined}>
            <FieldLabel htmlFor="reject-note">دلیل رد</FieldLabel>
            <Textarea id="reject-note" rows={4} placeholder="مثلاً مبلغ واریزی با تعداد هنرجویان مطابقت ندارد." {...form.register("note")} />
            {form.formState.errors.note ? <FieldError errors={[form.formState.errors.note]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting || loading}>
              {form.formState.isSubmitting ? "در حال ثبت…" : "رد رسید"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
