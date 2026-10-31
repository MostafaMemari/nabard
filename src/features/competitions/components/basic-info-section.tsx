"use client";

import type { Control } from "react-hook-form";
import { FormSection } from "@/components/shared";
import { disciplineLabels } from "../labels";
import type { CompetitionFormValues } from "../schemas";
import { FormSelectField, FormTextField } from "./form-fields";

export function BasicInfoSection({ control }: { control: Control<CompetitionFormValues> }) {
  return (
    <FormSection title="اطلاعات پایه" description="نام و رشته ورزشی مسابقه.">
      <FormTextField control={control} name="title" label="عنوان مسابقه" placeholder="مثلاً مسابقات قهرمانی استان تهران" />
      <FormSelectField control={control} name="discipline" label="رشته" items={disciplineLabels} />
    </FormSection>
  );
}
