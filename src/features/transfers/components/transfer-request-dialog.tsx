"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTransferLookup, useTransferRequestCreate } from "../hooks/use-transfers";
import { type CreateTransferRequestInput, createTransferRequestSchema } from "../schemas";

export function TransferRequestDialog({
  open,
  onOpenChange,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: () => void;
}) {
  const { lookup } = useTransferLookup();
  const { request } = useTransferRequestCreate(onRequested);
  const [result, setResult] = useState<{ maskedName: string; currentCoachName: string } | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<CreateTransferRequestInput>({
    resolver: zodResolver(createTransferRequestSchema),
    defaultValues: { nationalCode: "" },
  });

  function close() {
    form.reset({ nationalCode: "" });
    setResult(null);
    setError(null);
    onOpenChange(false);
  }

  async function check() {
    const valid = await form.trigger();
    if (!valid) return;

    setWorking(true);
    setError(null);
    const response = await lookup(form.getValues("nationalCode"));
    setWorking(false);
    if (response.ok) {
      setResult(response.data);
    } else {
      setResult(null);
      setError(response.error);
    }
  }

  async function confirm() {
    if (!result) return;

    setWorking(true);
    const done = await request(form.getValues("nationalCode"));
    setWorking(false);
    if (done) {
      close();
    }
  }

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
          <DialogDescription>کد ملی هنرجو را وارد کنید؛ پس از جستجو، نتیجه به صورت مخفی نشان داده می شود.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void (result ? confirm() : check());
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
          <p className="text-subtle text-xs text-muted-foreground">
            با تایید مدیر استان فقط مربی هنرجو تغییر می کند و ثبت نام ها و پرداخت های قبلی دست نخورده می مانند.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              انصراف
            </Button>
            {result ? (
              <Button type="submit" disabled={working}>
                {working ? "در حال ثبت…" : "ثبت درخواست"}
              </Button>
            ) : (
              <Button type="submit" disabled={working}>
                {working ? "در حال جستجو…" : "جستجو"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
