"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { ControlledSelectField, ControlledTextField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { personGenderLabels } from "@/features/base-data/labels";
import { useCounties } from "@/features/counties";
import { updateCoach } from "../api";
import { updateCoachSchema } from "../schemas";
import type { User } from "../types";

type CoachEditValues = z.input<typeof updateCoachSchema>;

const emptyForm: CoachEditValues = { fullName: "", mobile: "", nationalCode: "", countyId: "" };

export function CoachEditDialog({
  coach,
  onOpenChange,
  onSaved,
}: {
  coach: User | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const form = useForm<CoachEditValues, unknown, z.output<typeof updateCoachSchema>>({
    resolver: zodResolver(updateCoachSchema),
    values: coach
      ? {
          fullName: coach.fullName,
          mobile: coach.mobile,
          nationalCode: coach.nationalCode ?? "",
          countyId: coach.countyId ?? "",
          gender: coach.gender ?? undefined,
        }
      : emptyForm,
  });
  const { counties } = useCounties();
  const countyItems = Object.fromEntries(counties.map((county) => [county.id, county.name]));

  async function submit(values: z.output<typeof updateCoachSchema>) {
    if (!coach) return;

    try {
      await updateCoach(coach.id, values);
      toast.success("اطلاعات مربی ذخیره شد");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <Dialog open={coach !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ویرایش مربی</DialogTitle>
          <DialogDescription>جنسیت مربی وقتی تغییر می کند که هنرجوی هم جنسیت دیگری نداشته باشد</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="flex flex-col gap-4">
          <ControlledTextField control={form.control} name="fullName" label="نام و نام خانوادگی" placeholder="مثلاً رضا محمدی" />
          <ControlledTextField control={form.control} name="mobile" label="شماره همراه" inputMode="numeric" dir="ltr" autoComplete="off" />
          <ControlledTextField control={form.control} name="nationalCode" label="کد ملی" inputMode="numeric" dir="ltr" autoComplete="off" />
          <ControlledSelectField control={form.control} name="countyId" label="شهرستان" items={countyItems} />
          <ControlledSelectField control={form.control} name="gender" label="جنسیت" items={personGenderLabels} />
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
