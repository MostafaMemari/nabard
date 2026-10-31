"use client";

import { ErrorBanner, FormActions, PageHeader } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompetitionForm } from "../hooks/use-competition-form";
import { BasicInfoSection } from "./basic-info-section";
import { CompetitionFormLocked } from "./competition-form-locked";
import { ParticipantsSection } from "./participants-section";
import { SchedulePaymentSection } from "./schedule-payment-section";
import { WeightClassHint } from "./weight-class-hint";

export function CompetitionFormScreen({ competitionId }: { competitionId?: string }) {
  const { isEdit, form, values, belts, weightClasses, weightLoading, locked, competitionLoading, competitionError, missing, submit } =
    useCompetitionForm(competitionId);

  if (locked) {
    return <CompetitionFormLocked competitionId={competitionId ?? ""} />;
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

  if (isEdit && (competitionError || missing)) {
    return (
      <div className="mx-auto w-full max-w-2xl pt-8">
        <ErrorBanner message="مسابقه یافت نشد." />
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
        <WeightClassHint
          visible={values.discipline === "KYORUGI" && values.ageCategoryId !== "" && values.gender !== ""}
          classes={weightClasses}
          isLoading={weightLoading}
        />
      </ParticipantsSection>

      <SchedulePaymentSection control={form.control} />

      <FormActions
        cancelHref={isEdit ? `/admin/competitions/${competitionId}` : "/admin/competitions"}
        submitLabel="ذخیره"
        submitting={form.formState.isSubmitting}
      />
    </form>
  );
}
