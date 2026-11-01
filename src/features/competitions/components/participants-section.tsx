"use client";
import { UsersRoundIcon } from "lucide-react";

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { FormSection } from "@/components/shared";
import { BeltChip } from "@/components/shared/belt-chip";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ageCategoryLabels, type Belt, genderLabels } from "@/features/base-data";
import type { CompetitionFormValues } from "../schemas";
import { FormSelectField } from "./form-fields";

export function ParticipantsSection({
  control,
  belts,
  children,
}: {
  control: Control<CompetitionFormValues>;
  belts: Belt[];
  children?: React.ReactNode;
}) {
  const ageItems = Object.fromEntries(
    (["BLOSSOM", "YOUTH", "CADET", "JUNIOR", "YOUNG", "SENIOR", "ULTRA"] as const).map((name) => [
      name.toLowerCase(),
      ageCategoryLabels[name],
    ]),
  );

  return (
    <FormSection title="شرکت کنندگان" description="جنسیت و بازه سنی و کمربندهای مجاز برای شرکت در مسابقه." icon={UsersRoundIcon}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField control={control} name="gender" label="جنسیت" items={genderLabels} />
        <FormSelectField control={control} name="ageCategoryId" label="رده سنی" items={ageItems} />
      </div>
      <Controller
        control={control}
        name="beltIds"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.error ? "" : undefined}>
            <FieldLabel>کمربندهای مجاز</FieldLabel>
            <ToggleGroup
              multiple
              value={field.value}
              onValueChange={(value) => field.onChange([...value])}
              className="flex-wrap"
              aria-label="کمربندهای مجاز"
            >
              {belts.map((belt) => (
                <ToggleGroupItem
                  key={belt.id}
                  value={belt.id}
                  variant="outline"
                  className="aria-pressed:border-primary/40 aria-pressed:bg-primary-subtle aria-pressed:text-primary"
                >
                  <BeltChip belt={belt} className="border-none bg-transparent px-0" />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
      {children}
    </FormSection>
  );
}
