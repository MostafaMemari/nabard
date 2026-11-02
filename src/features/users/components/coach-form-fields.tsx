"use client";

import { type Control, Controller } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CoachFormValues } from "../schemas";

export function CoachTextField({
  control,
  name,
  label,
  ...input
}: {
  control: Control<CoachFormValues>;
  name: keyof CoachFormValues;
  label: string;
} & Omit<React.ComponentProps<typeof Input>, "id" | "name">) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? "" : undefined}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input id={name} {...field} {...input} value={field.value ?? ""} />
          {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
