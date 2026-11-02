"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useTransferDecision } from "../hooks/use-transfers";
import { type RejectTransferValues, rejectTransferSchema } from "../schemas";
import type { TransferRequest } from "../types";

export function TransferDecisionDialog({
  request,
  decision,
  onClose,
  onDecided,
}: {
  request: TransferRequest | null;
  decision: "approve" | "reject";
  onClose: () => void;
  onDecided: () => void;
}) {
  const { decide } = useTransferDecision(onDecided);
  const form = useForm<RejectTransferValues, unknown, RejectTransferValues>({
    resolver: zodResolver(rejectTransferSchema),
    defaultValues: { note: "" },
  });
  const approving = decision === "approve";

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  async function submit(values: RejectTransferValues) {
    if (!request) return;

    const done = await decide(request.id, decision, values.note?.trim());
    if (done) {
      close();
    }
  }

  async function approve() {
    if (!request) return;

    const done = await decide(request.id, "approve");
    if (done) {
      close();
    }
  }

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{approving ? "تایید انتقال هنرجو" : "رد درخواست انتقال"}</DialogTitle>
          <DialogDescription>
            {approving
              ? `هنرجو «${request?.studentName ?? ""}» از «${request?.fromCoachName ?? ""}» به «${request?.toCoachName ?? ""}» منتقل می شود.`
              : `درخواست انتقال هنرجو «${request?.studentName ?? ""}» رد می شود.`}
          </DialogDescription>
        </DialogHeader>
        {approving ? (
          <p className="text-subtle rounded-lg bg-primary-subtle px-3 py-2 text-primary">
            فقط مربی هنرجو تغییر می کند؛ ثبت نام ها، پرداخت ها و بازپرداخت های قبلی با مربی قبلی می مانند.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
            <Field data-invalid={form.formState.errors.note ? "" : undefined}>
              <FieldLabel htmlFor="transfer-note">دلیل رد درخواست</FieldLabel>
              <Textarea
                id="transfer-note"
                rows={3}
                placeholder="مثلاً انتقال در این بازه زمانی امکان پذیر نیست."
                {...form.register("note")}
              />
              {form.formState.errors.note ? <FieldError errors={[form.formState.errors.note]} /> : null}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                انصراف
              </Button>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "در حال ثبت…" : "رد درخواست"}
              </Button>
            </DialogFooter>
          </form>
        )}
        {approving ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              انصراف
            </Button>
            <Button type="button" onClick={() => void approve()}>
              تایید انتقال
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
