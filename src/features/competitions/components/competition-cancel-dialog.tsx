"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cancelCompetitionSchema } from "../schemas";

type CancelFormValues = { reason: string };

export function CompetitionCancelDialog({
  open,
  onOpenChange,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const form = useForm<CancelFormValues, unknown, CancelFormValues>({
    resolver: zodResolver(cancelCompetitionSchema),
    defaultValues: { reason: "" },
  });

  async function submit(values: CancelFormValues) {
    await onConfirm(values.reason.trim());
    form.reset({ reason: "" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset({ reason: "" });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>لغو مسابقه</DialogTitle>
          <DialogDescription>با لغو مسابقه، از فهرست مسابقات باز مربیان حذف می شود و ثبت نام جدید ممکن نخواهد بود.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={form.formState.errors.reason ? "" : undefined}>
            <FieldLabel htmlFor="cancel-reason">دلیل لغو</FieldLabel>
            <Textarea
              id="cancel-reason"
              rows={4}
              placeholder="مثلاً برگزاری مسابقه با توجه به تعویض سالن ممکن نیست."
              {...form.register("reason")}
            />
            {form.formState.errors.reason ? <FieldError errors={[form.formState.errors.reason]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting || loading}>
              لغو مسابقه
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
