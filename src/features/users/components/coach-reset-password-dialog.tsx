"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resetCoachPassword } from "../api";
import { type ResetCoachPasswordInput, resetCoachPasswordSchema } from "../schemas";
import type { User } from "../types";

const emptyForm: ResetCoachPasswordInput = { password: "" };

export function CoachResetPasswordDialog({
  coach,
  onDone,
  onClose,
}: {
  coach: User | null;
  onDone: () => Promise<unknown>;
  onClose: () => void;
}) {
  const form = useForm<ResetCoachPasswordInput, unknown, ResetCoachPasswordInput>({
    resolver: zodResolver(resetCoachPasswordSchema),
    defaultValues: emptyForm,
  });

  async function submit(values: ResetCoachPasswordInput) {
    if (!coach) return;
    try {
      await resetCoachPassword(coach.id, values.password);
      toast.success("رمز عبور مربی بازنشانی شد");
      form.reset(emptyForm);
      await onDone();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "بازنشانی رمز عبور انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <Dialog
      open={coach !== null}
      onOpenChange={(open) => {
        if (!open) {
          form.reset(emptyForm);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بازنشانی رمز عبور</DialogTitle>
          <DialogDescription>
            رمز عبور تازه «{coach?.fullName}» را تعیین کنید و آن را به خودش اعلام کنید؛ رمز قبلی بی اعتبار می شود
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField
            control={form.control}
            name="password"
            label="رمز عبور جدید"
            type="password"
            autoComplete="new-password"
            placeholder="حداقل ۸ کاراکتر"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
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
