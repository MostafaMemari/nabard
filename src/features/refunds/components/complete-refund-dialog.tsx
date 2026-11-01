"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatRialsAsToman } from "@/lib/format";
import { useRefundCompletion } from "../hooks/use-refund-completion";
import { type CompleteRefundValues, completeRefundSchema } from "../schemas";
import type { Refund } from "../types";

export function CompleteRefundDialog({
  refund,
  onClose,
  onCompleted,
}: {
  refund: Refund | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const form = useForm<CompleteRefundValues, unknown, CompleteRefundValues>({
    resolver: zodResolver(completeRefundSchema),
    defaultValues: { note: "" },
  });
  const { working, complete } = useRefundCompletion(onCompleted);

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  async function submit(values: CompleteRefundValues) {
    if (!refund) return;

    const done = await complete(refund.id, values.note?.trim() || undefined);
    if (done) {
      close();
    }
  }

  const amount = refund ? formatRialsAsToman(Number(refund.amount)) : "";

  return (
    <Dialog
      open={refund !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>ثبت بازپرداخت</DialogTitle>
          <DialogDescription>
            بازپرداخت {amount} تومان به مربی هنرجوی «{refund?.studentName ?? ""}» ثبت می شود.
          </DialogDescription>
        </DialogHeader>
        {refund?.note ? <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{refund.note}</p> : null}
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <Field data-invalid={form.formState.errors.note ? "" : undefined}>
            <FieldLabel htmlFor="refund-note">یادداشت (اختیاری)</FieldLabel>
            <Textarea id="refund-note" rows={3} placeholder="مثلاً شماره پیگیری حواله." {...form.register("note")} />
            {form.formState.errors.note ? <FieldError errors={[form.formState.errors.note]} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || working}>
              {form.formState.isSubmitting || working ? "در حال ثبت…" : "ثبت بازپرداخت"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
