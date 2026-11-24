"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Note } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { provinceLabels } from "@/lib/provinces";
import { useProvinceChangeDecision } from "../hooks/use-province-changes";
import { type RejectProvinceChangeValues, rejectProvinceChangeSchema } from "../schemas";
import type { ProvinceChangeRequest } from "../types";

export function ProvinceChangeDecisionDialog({
  request,
  decision,
  onClose,
  onDecided,
}: {
  request: ProvinceChangeRequest | null;
  decision: "approve" | "reject";
  onClose: () => void;
  onDecided: () => void;
}) {
  const { decide } = useProvinceChangeDecision(onDecided);
  const form = useForm<RejectProvinceChangeValues, unknown, RejectProvinceChangeValues>({
    resolver: zodResolver(rejectProvinceChangeSchema),
    defaultValues: { note: "" },
  });
  const approving = decision === "approve";
  const [working, setWorking] = useState(false);

  function close() {
    form.reset({ note: "" });
    onClose();
  }

  async function submit(values: RejectProvinceChangeValues) {
    if (!request) return;

    const done = await decide(request.id, decision, values.note?.trim());
    if (done) {
      close();
    }
  }

  async function approve() {
    if (!request) return;

    setWorking(true);
    const done = await decide(request.id, "approve");
    setWorking(false);
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
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{approving ? "تأیید تغییر استان هنرجو" : "رد درخواست تغییر استان"}</DialogTitle>
          <DialogDescription>
            {approving
              ? `هنرجو «${request?.studentName ?? ""}» از مربی «${request?.fromCoachName ?? ""}» به مربی «${request?.toCoachName ?? ""}» در استان ${request ? provinceLabels[request.toProvince] : ""} منتقل می شود`
              : `درخواست تغییر استان هنرجو «${request?.studentName ?? ""}» رد می شود`}
          </DialogDescription>
        </DialogHeader>
        {approving ? (
          <Note tone="primary">
            با تأیید، هنرجو از فهرست مربی فعلی خارج و به مربی استان شما منتقل می شود؛ سابقه ثبت نام ها باقی می ماند
          </Note>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
            <Field data-invalid={form.formState.errors.note ? "" : undefined}>
              <FieldLabel htmlFor="province-change-note">دلیل رد درخواست</FieldLabel>
              <Textarea
                id="province-change-note"
                rows={3}
                placeholder="مثلاً انتقال به استان شما در این بازه امکان پذیر نیست"
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
            <Button type="button" onClick={() => void approve()} disabled={working}></Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
