"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { type Gender, useAgeCategories, useBelts, useWeightClasses } from "@/features/base-data";
import { useRegistrations } from "@/features/registrations";
import { jalaliTodayIso } from "@/lib/format";
import { createCompetition, updateCompetition } from "../api";
import { useCompetition } from "../hooks/use-competitions";
import { type CompetitionFormValues, competitionSchema, createCompetitionFormSchema, emptyCompetitionForm } from "../schemas";
import type { CompetitionInput, CompetitionLevel, Discipline } from "../types";

export function useCompetitionForm(competitionId?: string) {
  const router = useRouter();
  const isEdit = competitionId !== undefined;

  const {
    competition,
    isLoading: competitionLoading,
    error: competitionError,
    mutate: retryCompetition,
  } = useCompetition(competitionId ?? "");
  const { registrations } = useRegistrations();
  const { belts } = useBelts();
  const { ageCategories } = useAgeCategories();

  const form = useForm<CompetitionFormValues, unknown, CompetitionFormValues>({
    resolver: zodResolver(isEdit ? competitionSchema : createCompetitionFormSchema),
    defaultValues: {
      ...emptyCompetitionForm,
      // Dates start on today so a new competition cannot be saved in the past.
      registrationDeadline: jalaliTodayIso(),
      eventDate: jalaliTodayIso(),
    },
  });
  const values = useWatch({ control: form.control });

  const { weightClasses, isLoading: weightLoading } = useWeightClasses(
    values.ageCategoryId !== "" && values.gender !== "" ? { ageCategoryId: values.ageCategoryId, gender: values.gender as Gender } : {},
  );

  useEffect(() => {
    if (isEdit && competition) {
      form.reset({
        title: competition.title,
        description: competition.description ?? "",
        discipline: competition.discipline,
        gender: competition.gender,
        ageCategoryId: competition.ageCategoryId,
        beltIds: [...competition.beltIds],
        level: competition.level,
        countyIds: [...competition.countyIds],
        feePerStudent: competition.feePerStudent,
        payeeCardNumber: competition.payeeCardNumber,
        payeeCardHolder: competition.payeeCardHolder,
        registrationDeadline: competition.registrationDeadline,
        eventDate: competition.eventDate,
      });
    }
  }, [isEdit, competition, form]);

  const locked = isEdit && registrations.some((registration) => registration.competitionId === competitionId);
  const missing = isEdit && !competitionLoading && !competition;

  async function submit(formValues: CompetitionFormValues) {
    const input: CompetitionInput = {
      title: formValues.title.trim(),
      description: formValues.description.trim() ? formValues.description.trim() : null,
      discipline: formValues.discipline as Discipline,
      gender: formValues.gender as Gender,
      ageCategoryId: formValues.ageCategoryId,
      beltIds: formValues.beltIds,
      level: formValues.level as CompetitionLevel,
      countyIds: formValues.level === "COUNTY" ? formValues.countyIds : [],
      feePerStudent: formValues.feePerStudent,
      payeeCardNumber: formValues.payeeCardNumber,
      payeeCardHolder: formValues.payeeCardHolder.trim(),
      registrationDeadline: formValues.registrationDeadline,
      eventDate: formValues.eventDate,
      province: "TEHRAN",
    };

    try {
      const saved = isEdit && competitionId ? await updateCompetition(competitionId, input) : await createCompetition(input);
      toast.success(isEdit ? "تغییرات مسابقه ذخیره شد" : "مسابقه ساخته شد");
      router.push(`/admin/competitions/${saved.id}`);
    } catch {
      toast.error("ذخیره انجام نشد. دوباره تلاش کنید");
    }
  }

  return {
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
  };
}
