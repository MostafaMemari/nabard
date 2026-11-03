"use client";

import type { FieldValues } from "react-hook-form";
import { FieldBody, type SharedFieldProps } from "./field-body";
import { JalaliDateField } from "./jalali-date-field";

export function ControlledDateField<T extends FieldValues>({ control, name, label }: SharedFieldProps<T>) {
  return (
    <FieldBody control={control} name={name} label={label}>
      {({ value, onChange }) => <JalaliDateField value={value} onChange={(iso: string) => onChange(iso)} />}
    </FieldBody>
  );
}
