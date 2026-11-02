"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ControlledSelectField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reassignCoachStudents } from "../api";
import { type ReassignStudentsInput, reassignStudentsSchema } from "../schemas";
import type { CoachTransferTarget } from "../types";

export function CoachReassignDialog({
  coachId,
  coachName,
  targets,
  studentCount,
  open,
  onOpenChange,
  onDone,
}: {
  coachId: string;
  coachName: string;
  targets: CoachTransferTarget[];
  studentCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const form = useForm<ReassignStudentsInput>({ resolver: zodResolver(reassignStudentsSchema), defaultValues: { toCoachId: "" } });
  const [working, setWorking] = useState(false);
  const items = Object.fromEntries(targets.map((target) => [target.id, target.fullName]));

  function close() {
    form.reset({ toCoachId: "" });
    onOpenChange(false);
  }

  async function submit(values: ReassignStudentsInput) {
    setWorking(true);
    try {
      const { moved } = await reassignCoachStudents(coachId, values.toCoachId);
      toast.success(`${moved} هنرجو به مربی منتقل شد.`);
      onDone();
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "انتقال انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
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
          <DialogTitle>انتقال هنرجویان</DialogTitle>
          <DialogDescription>همه هنرجویان «{coachName}» به مربی دیگری از همین استان منتقل می شوند.</DialogDescription>
        </DialogHeader>
        <p className="text-subtle rounded-lg bg-warning-bg px-3 py-2 text-warning">
          {studentCount} هنرجو منتقل می شود. ثبت نام ها و پرداخت ها با مربی فعلی می مانند و پروفایل هنرجویان تغییر نمی کند.
        </p>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledSelectField control={form.control} name="toCoachId" label="مربی مقصد" items={items} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              انصراف
            </Button>
            <Button type="submit" disabled={working || targets.length === 0}>
              {working ? "در حال انتقال…" : "انتقال هنرجویان"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
