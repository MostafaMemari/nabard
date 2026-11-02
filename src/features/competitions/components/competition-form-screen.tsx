"use client";

import { ErrorBanner, FormActions, FormContainer, PageHeader } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompetitionForm } from "../hooks/use-competition-form";
import { BasicInfoSection } from "./basic-info-section";
import { CompetitionFormLocked } from "./competition-form-locked";
import { ParticipantsSection } from "./participants-section";
import { SchedulePaymentSection } from "./schedule-payment-section";
import { WeightClassHint } from "./weight-class-hint";

export function CompetitionFormScreen({ competitionId }: { competitionId?: string }) {
  const {
    isEdit,
    form,
    values,
    belts,
    ageCategories,
    weightClasses,
    weightLoading,
    locked,
    competitionLoading,
    competitionError,
    retryCompetition,
    missing,
    submit,
  } = useCompetitionForm(competitionId);

  if (locked) {
    return <CompetitionFormLocked competitionId={competitionId ?? ""} />;
  }

  if (isEdit && competitionLoading) {
    return (
      <FormContainer variant="standard" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
      </FormContainer>
    );
  }

  if (isEdit && (competitionError || missing)) {
    return (
      <FormContainer variant="standard" className="pt-8">
        <ErrorBanner message="مسابقه یافت نشد." onRetry={() => void retryCompetition()} />
      </FormContainer>
    );
  }

  return (
    <FormContainer variant="standard">
      <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
        <PageHeader
          title={isEdit ? "ویرایش مسابقه" : "مسابقه جدید"}
          description={
            isEdit ? "اطلاعات مسابقه را ویرایش کنید." : "اطلاعات مسابقه را کامل کنید؛ مسابقه ابتدا به صورت پیش نویس ذخیره می شود."
          }
        />

        <BasicInfoSection control={form.control} />

        <ParticipantsSection control={form.control} belts={belts} ageCategories={ageCategories}>
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
    </FormContainer>
  );
}
