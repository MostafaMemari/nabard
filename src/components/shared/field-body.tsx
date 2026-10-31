"use client";

import type { ReactNode } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

export type SharedFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

export function FieldBody<T extends FieldValues>({
  control,
  name,
  label,
  children,
}: SharedFieldProps<T> & { children: (field: { value: string; onChange: (value: unknown) => void }) => ReactNode }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? "" : undefined}>
          <FieldLabel>{label}</FieldLabel>
          {children({ value: (field.value as string | null) ?? "", onChange: field.onChange })}
          {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
