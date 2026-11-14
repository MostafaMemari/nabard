"use client";

import { getYear } from "date-fns-jalali";
import type { FieldValues } from "react-hook-form";
import { FieldBody, type SharedFieldProps } from "./field-body";
import { JalaliDateField } from "./jalali-date-field";

// Birth dates need years far older than the generic default (juniors to
// veterans), but never a future year.
const birthYearFrom = 1330;
const birthYearTo = getYear(new Date());

export function ControlledDateField<T extends FieldValues>({
  control,
  name,
  label,
  variant = "default",
  min,
}: SharedFieldProps<T> & { variant?: "default" | "birth"; min?: string }) {
  const [yearFrom, yearTo] = variant === "birth" ? [birthYearFrom, birthYearTo] : [];
  return (
    <FieldBody control={control} name={name} label={label}>
      {({ value, onChange }) => (
        <JalaliDateField value={value} onChange={(iso: string) => onChange(iso)} yearFrom={yearFrom} yearTo={yearTo} min={min} />
      )}
    </FieldBody>
  );
}
