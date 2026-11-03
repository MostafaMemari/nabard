"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ControlledSelectField, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { roleLabels, useMe } from "@/features/auth";
import { useCounties } from "@/features/counties";
import { CoachPhotoField } from "@/features/users";
import { formatJalaliDate } from "@/lib/format";
import { useCountyChangeRequest, useMyCountyChange } from "../hooks/use-county-changes";
import { countyChangeStatusKey, countyChangeStatusLabels } from "../labels";
import { type CreateCountyChangeValues, createCountyChangeSchema } from "../schemas";
import type { CountyChangeRequest } from "../types";

function LatestRequest({ request }: { request: CountyChangeRequest | null }) {
  if (!request) {
    return <p className="text-subtle text-muted-foreground">درخواستی ثبت نکرده اید.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <StatusBadge status={countyChangeStatusKey(request.status)} />
        <span className="text-subtle text-muted-foreground">{formatJalaliDate(new Date(request.createdAt))}</span>
      </div>
      <p className="text-subtle text-sm">
        {countyChangeStatusLabels[request.status]}: {request.fromCountyName} ← {request.toCountyName}
      </p>
      {request.note ? <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{request.note}</p> : null}
    </div>
  );
}

function ChangeRequestForm({ counties, onRequested }: { counties: { id: string; name: string }[]; onRequested: () => void }) {
  const { requestChange } = useCountyChangeRequest(onRequested);
  const form = useForm<CreateCountyChangeValues, unknown, CreateCountyChangeValues>({
    resolver: zodResolver(createCountyChangeSchema),
    defaultValues: { toCountyId: "" },
  });
  const items = Object.fromEntries(counties.map((county) => [county.id, county.name]));

  async function submit(values: CreateCountyChangeValues) {
    const done = await requestChange(values.toCountyId);
    if (done) {
      form.reset({ toCountyId: "" });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-3">
      <ControlledSelectField control={form.control} name="toCountyId" label="شهرستان جدید" items={items} />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "در حال ارسال…" : "ثبت درخواست"}
      </Button>
    </form>
  );
}

export function CoachProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useMe();
  const { request, mutate } = useMyCountyChange();
  const { counties } = useCounties();
  const targetCounties = counties.filter((county) => county.id !== user?.countyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>پروفایل مربی</DialogTitle>
          <DialogDescription>شهرستان فعلی شما و وضعیت درخواست تغییر شهرستان.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          {user ? <CoachPhotoField userId={user.id} fullName={user.fullName} hasPhoto={user.hasPhoto} /> : null}
          <div className="h-px bg-border" aria-hidden />
          <div className="flex flex-col gap-2">
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-subtle text-muted-foreground">{user ? roleLabels[user.role] : ""}</p>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-subtle text-muted-foreground">شهرستان فعلی</span>
              <span className="font-medium">{user?.countyName ?? "نامشخص"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-semibold">درخواست تغییر شهرستان</p>
          <LatestRequest request={request} />
          {request?.status === "PENDING" ? (
            <p className="text-subtle text-muted-foreground">تا بررسی این درخواست نمی توانید درخواست جدیدی ثبت کنید.</p>
          ) : (
            <ChangeRequestForm counties={targetCounties} onRequested={() => void mutate()} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
