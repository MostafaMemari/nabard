"use client";
import { TrophyIcon } from "lucide-react";

import { type Control, useWatch } from "react-hook-form";
import { ControlledSelectField, FormSection } from "@/components/shared";
import { useCounties } from "@/features/counties";
import { competitionLevelLabels, disciplineLabels } from "../labels";
import type { CompetitionFormValues } from "../schemas";
import { FormSelectField, FormTextField } from "./form-fields";

export function BasicInfoSection({ control }: { control: Control<CompetitionFormValues> }) {
  const level = useWatch({ control, name: "level" });
  const { counties } = useCounties();
  const countyItems = Object.fromEntries(counties.map((county) => [county.id, county.name]));

  return (
    <FormSection title="اطلاعات پایه" description="نام، سطح و رشته ورزشی مسابقه." icon={TrophyIcon}>
      <FormTextField control={control} name="title" label="عنوان مسابقه" placeholder="مثلاً مسابقات قهرمانی استان تهران" />
      <FormSelectField control={control} name="level" label="سطح مسابقه" items={competitionLevelLabels} />
      {level === "COUNTY" ? (
        <ControlledSelectField control={control} name="hostCountyId" label="شهرستان میزبان" items={countyItems} />
      ) : null}
      <FormSelectField control={control} name="discipline" label="رشته" items={disciplineLabels} />
    </FormSection>
  );
}
