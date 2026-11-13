"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changePassword } from "../api";
import { type ChangePasswordInput, changePasswordSchema } from "../schemas";

const emptyForm: ChangePasswordInput = { currentPassword: "", newPassword: "" };

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const form = useForm<ChangePasswordInput, unknown, ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: emptyForm,
  });

  async function submit(values: ChangePasswordInput) {
    try {
      await changePassword(values);
      toast.success("رمز عبور تغییر کرد");
      form.reset(emptyForm);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تغییر رمز عبور انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(emptyForm);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغییر رمز عبور</DialogTitle>
          <DialogDescription>برای ادامه رمز عبور فعلی و رمز تازه را وارد کنید</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField
            control={form.control}
            name="currentPassword"
            label="رمز عبور فعلی"
            type="password"
            autoComplete="current-password"
          />
          <ControlledTextField
            control={form.control}
            name="newPassword"
            label="رمز عبور جدید"
            type="password"
            autoComplete="new-password"
            placeholder="حداقل ۸ کاراکتر"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
