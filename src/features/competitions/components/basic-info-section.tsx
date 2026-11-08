"use client";
import { TrophyIcon } from "lucide-react";

import { type Control, Controller, useWatch } from "react-hook-form";
import { FormSection } from "@/components/shared";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCounties } from "@/features/counties";
import { competitionLevelLabels, disciplineLabels } from "../labels";
import type { CompetitionFormValues } from "../schemas";
import { FormSelectField, FormTextAreaField, FormTextField } from "./form-fields";

export function BasicInfoSection({ control }: { control: Control<CompetitionFormValues> }) {
  const level = useWatch({ control, name: "level" });
  const { counties } = useCounties();

  return (
    <FormSection title="اطلاعات پایه" description="نام، سطح و رشته ورزشی مسابقه." icon={TrophyIcon}>
      <FormTextField control={control} name="title" label="عنوان مسابقه" placeholder="مثلاً مسابقات قهرمانی استان تهران" />
      <FormTextAreaField
        control={control}
        name="description"
        label="توضیحات (اختیاری)"
        placeholder="مثلاً آدرس سالن یا مدارک لازم"
        rows={4}
      />
      <FormSelectField control={control} name="level" label="سطح مسابقه" items={competitionLevelLabels} />
      {level === "COUNTY" ? (
        <Controller
          control={control}
          name="countyIds"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.error ? "" : undefined}>
              <FieldLabel>شهرستان های برگزار کننده</FieldLabel>
              <ToggleGroup
                multiple
                value={field.value}
                onValueChange={(value) => field.onChange([...value])}
                className="flex-wrap"
                aria-label="شهرستان های برگزار کننده"
              >
                {counties.map((county) => (
                  <ToggleGroupItem
                    key={county.id}
                    value={county.id}
                    variant="outline"
                    className="aria-pressed:border-primary/40 aria-pressed:bg-primary-subtle aria-pressed:text-primary"
                  >
                    {county.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      ) : null}
      <FormSelectField control={control} name="discipline" label="رشته" items={disciplineLabels} />
    </FormSection>
  );
}
