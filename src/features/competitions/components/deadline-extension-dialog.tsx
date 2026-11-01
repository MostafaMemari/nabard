"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ControlledDateField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { extendCompetitionSchema } from "../schemas";
import type { Competition, ExtendCompetitionInput } from "../types";
import { DeadlineExtensionHistory } from "./deadline-extension-history";

type ExtensionFormValues = { newDeadline: string; reason: string; reopenForRejected?: boolean };

export function DeadlineExtensionDialog({
  open,
  onOpenChange,
  competition,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition;
  loading: boolean;
  onConfirm: (input: ExtendCompetitionInput) => Promise<void>;
}) {
  const emptyValues = (currentDeadline: string): ExtensionFormValues => ({
    newDeadline: currentDeadline,
    reason: "",
    reopenForRejected: false,
  });
  const form = useForm<ExtensionFormValues, unknown, ExtensionFormValues>({
    resolver: zodResolver(extendCompetitionSchema),
    defaultValues: emptyValues(competition.registrationDeadline),
  });

  async function submit(values: ExtensionFormValues) {
    try {
      await onConfirm(values);
      form.reset(emptyValues(competition.registrationDeadline));
    } catch {
      // the toast reports the failure; keep the form values for a retry
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset(emptyValues(competition.registrationDeadline));
        }
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false} className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تمدید مهلت ثبت نام</DialogTitle>
          <DialogDescription>
            مهلت جدید باید بعد از مهلت فعلی و قبل از تاریخ برگزاری باشد. پس از وجود ثبت نام، تمدید تنها راه تغییر مهلت است.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledDateField control={form.control} name="newDeadline" label="مهلت جدید" />
          <Field data-invalid={form.formState.errors.reason ? "" : undefined}>
            <FieldLabel htmlFor="extension-reason">دلیل تمدید</FieldLabel>
            <Textarea
              id="extension-reason"
              rows={3}
              placeholder="مثلاً ثبت مدارک برخی هنرجوها با تأخیر انجام شده است."
              {...form.register("reason")}
            />
            {form.formState.errors.reason ? <FieldError errors={[form.formState.errors.reason]} /> : null}
          </Field>
          <label htmlFor="extension-reopen" className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              id="extension-reopen"
              checked={form.watch("reopenForRejected")}
              onCheckedChange={(checked) => form.setValue("reopenForRejected", checked === true)}
            />
            بازگشایی ثبت نام برای هنرجوهایی که ثبت نام قبلی آن ها رد شده است
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || loading}>
              ثبت تمدید
            </Button>
          </DialogFooter>
        </form>
        <DeadlineExtensionHistory competitionId={competition.id} open={open} />
      </DialogContent>
    </Dialog>
  );
}
