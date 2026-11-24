"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTransferRequestDialog } from "../hooks/use-transfer-request-dialog";

export function TransferRequestDialog({
  open,
  onOpenChange,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: () => void;
}) {
  const { form, result, working, error, close, submit } = useTransferRequestDialog({ onOpenChange, onRequested });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>انتقال هنرجو به من</DialogTitle>
          <DialogDescription>کد ملی هنرجو را وارد کنید؛ پس از جستجو، نتیجه به صورت مخفی نشان داده می شود</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <Field data-invalid={form.formState.errors.nationalCode || error ? "" : undefined}>
            <FieldLabel htmlFor="transfer-national-code">کد ملی هنرجو</FieldLabel>
            <Input id="transfer-national-code" inputMode="numeric" placeholder="مثلاً ۰۴۹۹۳۷۰۸۹۹" {...form.register("nationalCode")} />
            {form.formState.errors.nationalCode ? <FieldError errors={[form.formState.errors.nationalCode]} /> : null}
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>
          {result ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
              <p className="text-sm font-medium">{result.maskedName}</p>
              <p className="text-subtle text-muted-foreground">مربی فعلی: {result.currentCoachName}</p>
            </div>
          ) : null}
          <p className="text-subtle text-muted-foreground">
            با تأیید مدیر استان فقط مربی هنرجو تغییر می کند و ثبت نام ها و پرداخت های قبلی دست نخورده می مانند
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" disabled={working}>
              {working ? (result ? "در حال ثبت…" : "در حال جستجو…") : result ? "ثبت درخواست" : "جستجو"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
