"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useCountyChangeDecision } from "../hooks/use-county-changes";
import { type RejectCountyChangeValues, rejectCountyChangeSchema } from "../schemas";
import type { CountyChangeRequest } from "../types";

export function CountyChangeDecisionDialog({
  request,
  decision,
  onClose,
  onDecided,
}: {
  request: CountyChangeRequest | null;
  decision: "approve" | "reject";
  onClose: () => void;
  onDecided: () => void;
}) {
  const { decide } = useCountyChangeDecision(onDecided);
  const form = useForm<RejectCountyChangeValues, unknown, RejectCountyChangeValues>({
    resolver: zodResolver(rejectCountyChangeSchema),
    defaultValues: { note: "" },
  });
  const approving = decision === "approve";

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  async function submit(values: RejectCountyChangeValues) {
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
          <DialogTitle>{approving ? "تأیید درخواست" : "رد درخواست"}</DialogTitle>
          <DialogDescription>
            {approving
              ? `شهرستان مربی «${request?.coachName ?? ""}» به «${request?.toCountyName ?? ""}» تغییر می کند.`
              : `درخواست تغییر شهرستان مربی «${request?.coachName ?? ""}» رد می شود.`}
          </DialogDescription>
        </DialogHeader>
        {approving ? (
          <p className="text-subtle rounded-lg bg-primary-subtle px-3 py-2 text-primary">
            ثبت نام ها و هنرجویان مربی بدون تغییر می مانند و فقط شهرستان او به روز می شود.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
            <Field data-invalid={form.formState.errors.note ? "" : undefined}>
              <FieldLabel htmlFor="county-change-note">دلیل رد درخواست</FieldLabel>
              <Textarea
                id="county-change-note"
                rows={3}
                placeholder="مثلاً تغییر شهرستان در این بازه زمانی امکان پذیر نیست."
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
              تأیید درخواست
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
