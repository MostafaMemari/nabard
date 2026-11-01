"use client";

import { type Control, Controller } from "react-hook-form";
import { ControlledSelectField } from "@/components/shared";
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

export function CoachSelectField({
  control,
  name,
  label,
  items,
}: {
  control: Control<CoachFormValues>;
  name: keyof CoachFormValues;
  label: string;
  items: Record<string, React.ReactNode>;
}) {
  return <ControlledSelectField control={control} name={name} label={label} items={items} />;
}
