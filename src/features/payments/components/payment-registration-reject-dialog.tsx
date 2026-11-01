"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { Registration } from "@/features/registrations";
import { type RejectRegistrationValues, rejectRegistrationSchema } from "@/features/registrations";

export function PaymentRegistrationRejectDialog({
  registration,
  loading,
  onClose,
  onConfirm,
}: {
  registration: Registration | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (registration: Registration, note: string) => void;
}) {
  const form = useForm<RejectRegistrationValues, unknown, RejectRegistrationValues>({
    resolver: zodResolver(rejectRegistrationSchema),
    defaultValues: { note: "" },
  });

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  function submit(values: RejectRegistrationValues) {
    if (registration) {
      onConfirm(registration, values.note.trim());
    }
    form.reset({ note: "" });
  }

  const name = registration?.student.fullName ?? "";

  return (
    <Dialog
      open={registration !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>رد ثبت نام</DialogTitle>
          <DialogDescription>ثبت نام «{name}» رد می شود و دلیل آن برای مربی نمایش داده می شود.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={form.formState.errors.note ? "" : undefined}>
            <FieldLabel htmlFor="registration-reject-note">دلیل رد</FieldLabel>
            <Textarea
              id="registration-reject-note"
              rows={4}
              placeholder="مثلاً رده وزنی هنرجو با مسابقه همخوانی ندارد."
              {...form.register("note")}
            />
            {form.formState.errors.note ? <FieldError errors={[form.formState.errors.note]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting || loading}>
              {form.formState.isSubmitting ? "در حال ثبت…" : "رد ثبت نام"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
