"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { rejectProfileSchema } from "../schemas";

export function RejectProfileDialog({
  studentName,
  working,
  onReject,
  onClose,
}: {
  studentName: string;
  working: boolean;
  onReject: (note: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const form = useForm<{ note: string }, unknown, { note: string }>({
    resolver: zodResolver(rejectProfileSchema),
    defaultValues: { note: "" },
  });

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  async function submit(values: { note: string }) {
    const done = await onReject(values.note.trim());
    if (done) {
      close();
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>رد پروفایل هنرجو</DialogTitle>
          <DialogDescription>پروفایل «{studentName}» رد می شود و مربی باید آن را اصلاح کند.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={form.formState.errors.note ? "" : undefined}>
            <FieldLabel htmlFor="profile-reject-note">دلیل رد</FieldLabel>
            <Textarea id="profile-reject-note" rows={3} placeholder="مثلاً عکس پرسنلی ناخوانا است." {...form.register("note")} />
            {form.formState.errors.note ? <FieldError errors={[form.formState.errors.note]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || working}>
              {form.formState.isSubmitting || working ? "در حال ثبت…" : "رد پروفایل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
