"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinnedIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { ControlledSelectField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listCoachTargets } from "@/features/users";
import { provinceLabels, provinceValues } from "@/lib/provinces";
import { useProvinceChangeCreate } from "../hooks/use-province-changes";
import { type CreateProvinceChangeValues, createProvinceChangeSchema } from "../schemas";

// The current coach picks the destination province and its receiving coach.
// The request goes to the destination province admin for approval.
export function ProvinceChangeRequestDialog({
  studentId,
  studentName,
  currentProvince,
  open,
  hasPending,
  onOpenChange,
  onRequested,
}: {
  studentId: string;
  studentName: string;
  currentProvince: string | null;
  open: boolean;
  hasPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: () => void;
}) {
  const { request } = useProvinceChangeCreate(onRequested);
  const form = useForm<CreateProvinceChangeValues, unknown, CreateProvinceChangeValues>({
    resolver: zodResolver(createProvinceChangeSchema),
    defaultValues: { toProvince: "", toCoachId: "" },
  });
  const toProvince = form.watch("toProvince");
  const [working, setWorking] = useState(false);

  const targets = useSWR(toProvince ? ["coach-targets", toProvince] : null, () => listCoachTargets(toProvince));
  const targetItems = Object.fromEntries((targets.data ?? []).map((target) => [target.id, target.fullName]));

  const provinceItems = Object.fromEntries(
    provinceValues.filter((province) => province !== currentProvince).map((province) => [province, provinceLabels[province]]),
  );

  function close() {
    form.reset({ toProvince: "", toCoachId: "" });
    onOpenChange(false);
  }

  async function submit(values: CreateProvinceChangeValues) {
    setWorking(true);
    const done = await request(studentId, values);
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
          <DialogTitle>درخواست تغییر استان «{studentName}»</DialogTitle>
          <DialogDescription>
            استان مقصد و مربی جدید را انتخاب کنید؛ درخواست برای ادمین استان مقصد ارسال می شود و با تأیید او هنرجو منتقل می شود
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          {hasPending ? (
            <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2.5 text-warning">
              برای این هنرجو درخواست انتقال یا تغییر استان در انتظار بررسی وجود دارد؛ تا نتیجه آن، درخواست جدید ثبت نمی شود
            </p>
          ) : null}
          <ControlledSelectField
            control={form.control}
            name="toProvince"
            label="استان مقصد"
            placeholder="انتخاب استان"
            items={provinceItems}
            onValueChange={(value) => {
              form.setValue("toCoachId", "");
              if (value) {
                void form.trigger("toProvince");
              }
            }}
          />
          {toProvince ? (
            <ControlledSelectField
              control={form.control}
              name="toCoachId"
              label="مربی مقصد"
              placeholder={targets.isLoading ? "در حال دریافت مربیان…" : "انتخاب مربی"}
              items={targetItems}
            />
          ) : null}
          {toProvince && !targets.isLoading && (targets.data ?? []).length === 0 ? (
            <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2 text-warning">
              مربی فعالی در این استان ثبت نشده است؛ استان دیگری را انتخاب کنید
            </p>
          ) : null}
          <p className="text-subtle text-muted-foreground">
            جنسیت مربی مقصد باید با جنسیت هنرجو یکسان باشد؛ در غیر این صورت درخواست ثبت نمی شود
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" disabled={working || targets.isLoading}>
              <MapPinnedIcon data-icon="inline-start" />
              {working ? "در حال ثبت…" : "ثبت درخواست"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
