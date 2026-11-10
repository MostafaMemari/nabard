"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRightIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { ControlledSelectField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listCoachTargets } from "@/features/users";
import { useCoachChangeRequest } from "../hooks/use-transfers";
import { type CreateCoachChangeValues, createCoachChangeSchema } from "../schemas";

// The student's own coach picks the receiving coach of the SAME province;
// approval moves the student under the new coach.
export function CoachChangeDialog({
  studentId,
  studentName,
  open,
  hasPending,
  onOpenChange,
  onRequested,
}: {
  studentId: string;
  studentName: string;
  open: boolean;
  hasPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: () => void;
}) {
  const { request } = useCoachChangeRequest(onRequested);
  const form = useForm<CreateCoachChangeValues, unknown, CreateCoachChangeValues>({
    resolver: zodResolver(createCoachChangeSchema),
    defaultValues: { toCoachId: "" },
  });
  const [working, setWorking] = useState(false);

  const targets = useSWR(open ? ["coach-targets", "own-province"] : null, () => listCoachTargets());
  const items = Object.fromEntries((targets.data ?? []).map((target) => [target.id, target.fullName]));

  function close() {
    form.reset({ toCoachId: "" });
    onOpenChange(false);
  }

  async function submit(values: CreateCoachChangeValues) {
    setWorking(true);
    const done = await request(studentId, values.toCoachId);
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
          <DialogTitle>درخواست تغییر مربی «{studentName}»</DialogTitle>
          <DialogDescription>
            مربی جدید را از مربیان استان خود انتخاب کنید؛ با تأیید ادمین استان، هنرجو به مربی جدید منتقل می شود.
          </DialogDescription>
        </DialogHeader>
        {hasPending ? (
          <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2.5 text-warning">
            یک درخواست انتقال یا تغییر استان برای این هنرجو در انتظار بررسی است؛ تا نتیجه آن، درخواست جدید ثبت نمی شود.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
            <ControlledSelectField
              control={form.control}
              name="toCoachId"
              label="مربی مقصد"
              placeholder={targets.isLoading ? "در حال دریافت مربیان…" : "انتخاب مربی"}
              items={items}
            />
            {targets.data !== undefined && targets.data.length === 0 ? (
              <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2 text-warning">مربی فعال دیگری در استان شما ثبت نشده است.</p>
            ) : null}
            <p className="text-subtle text-muted-foreground">
              ثبت نام ها و پرداخت های قبلی هنرجو با مربی فعلی می ماند و فقط مربی هنرجو تغییر می کند.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={close}>
                انصراف
              </Button>
              <Button type="submit" disabled={working || targets.isLoading}>
                <ArrowLeftRightIcon data-icon="inline-start" />
                {working ? "در حال ثبت…" : "ثبت درخواست"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
