"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Gender, useBelts, useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { createCompetition, updateCompetition } from "../api";
import { useCompetition } from "../hooks/use-competitions";
import { disciplineLabels } from "../labels";
import { type CompetitionFormValues, createCompetitionSchema, emptyCompetitionForm } from "../schemas";
import type { CompetitionInput, Discipline } from "../types";
import { BasicInfoSection } from "./basic-info-section";
import { ParticipantsSection } from "./participants-section";
import { SchedulePaymentSection } from "./schedule-payment-section";
import { WeightClassTable } from "./weight-class-table";

export function CompetitionFormScreen({ competitionId }: { competitionId?: string }) {
  const router = useRouter();
  const isEdit = competitionId !== undefined;

  const { competition, isLoading: competitionLoading } = useCompetition(competitionId ?? "");
  const { registrations } = useRegistrations();
  const { belts } = useBelts();

  const hasRegistrations = registrations.some((registration) => registration.competitionId === competitionId);

  const beltLevels = useMemo(() => Object.fromEntries(belts.map((belt) => [belt.id, belt.level])), [belts]);
  const schema = useMemo(() => createCompetitionSchema(beltLevels), [beltLevels]);

  const form = useForm<CompetitionFormValues, unknown, CompetitionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyCompetitionForm,
  });
  const values = useWatch({ control: form.control });

  const { weightClasses, isLoading: weightLoading } = useWeightClasses(
    values.ageCategoryId !== "" && values.gender !== "" ? { ageCategoryId: values.ageCategoryId, gender: values.gender as Gender } : {},
  );

  useEffect(() => {
    if (isEdit && competition) {
      form.reset({
        title: competition.title,
        discipline: competition.discipline,
        gender: competition.gender,
        ageCategoryId: competition.ageCategoryId,
        minBeltId: competition.minBeltId,
        maxBeltId: competition.maxBeltId,
        feePerStudent: competition.feePerStudent,
        payeeCardNumber: competition.payeeCardNumber,
        payeeCardHolder: competition.payeeCardHolder,
        registrationDeadline: competition.registrationDeadline,
        eventDate: competition.eventDate,
      });
    }
  }, [isEdit, competition, form]);

  if (isEdit && hasRegistrations) {
    return (
      <section className="mx-auto w-full max-w-2xl">
        <PageHeader title="ویرایش مسابقه" />
        <div className="mt-4 rounded-xl border border-border bg-card shadow-card">
          <EmptyState
            icon={<LockIcon aria-hidden />}
            title="این مسابقه ثبت‌نام دارد و اطلاعات آن قابل ویرایش نیست."
            action={
              <Button render={<Link href={`/admin/competitions/${competitionId}`} />} size="sm" variant="outline">
                بازگشت به جزئیات مسابقه
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  async function submit(values: CompetitionFormValues) {
    const input: CompetitionInput = {
      title: values.title.trim(),
      discipline: values.discipline as Discipline,
      gender: values.gender as Gender,
      ageCategoryId: values.ageCategoryId,
      minBeltId: values.minBeltId,
      maxBeltId: values.maxBeltId,
      feePerStudent: values.feePerStudent,
      payeeCardNumber: values.payeeCardNumber,
      payeeCardHolder: values.payeeCardHolder.trim(),
      registrationDeadline: values.registrationDeadline,
      eventDate: values.eventDate,
      province: "TEHRAN",
    };

    try {
      const saved = isEdit && competitionId ? await updateCompetition(competitionId, input) : await createCompetition(input);
      toast.success(isEdit ? "تغییرات مسابقه ذخیره شد." : "مسابقه ساخته شد.");
      router.push(`/admin/competitions/${saved.id}`);
    } catch {
      toast.error("ذخیره انجام نشد. دوباره تلاش کنید.");
    }
  }

  if (isEdit && competitionLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="mx-auto flex w-full max-w-2xl flex-col gap-4" noValidate>
      <PageHeader
        title={isEdit ? "ویرایش مسابقه" : "مسابقه جدید"}
        description={isEdit ? "اطلاعات مسابقه را ویرایش کنید." : "اطلاعات مسابقه را کامل کنید؛ مسابقه ابتدا به‌صورت پیش‌نویس ذخیره می‌شود."}
      />

      <BasicInfoSection control={form.control} />

      <ParticipantsSection control={form.control} belts={belts}>
        {values.discipline === "KYORUGI" && values.ageCategoryId !== "" && values.gender !== "" ? (
          <div className="flex flex-col gap-2 rounded-lg bg-primary-subtle/60 p-3">
            <p className="text-subtle text-muted-foreground">
              رده‌های وزنی {disciplineLabels.KYORUGI} برای رده سنی و جنسیت انتخاب‌شده به‌صورت خودکار تعیین می‌شود:
            </p>
            <WeightClassTable classes={weightClasses} isLoading={weightLoading} />
          </div>
        ) : null}
      </ParticipantsSection>

      <SchedulePaymentSection control={form.control} />

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          render={<Link href={isEdit ? `/admin/competitions/${competitionId}` : "/admin/competitions"} />}
        >
          انصراف
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
        </Button>
      </div>
    </form>
  );
}
