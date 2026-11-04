"use client";

import type { ComponentProps } from "react";
import type { Control } from "react-hook-form";
import { ControlledDateField, ControlledSelectField, ControlledTextAreaField, ControlledTextField } from "@/components/shared";
import type { CompetitionFormValues } from "../schemas";

type FieldProps = {
  control: Control<CompetitionFormValues>;
  name: Exclude<keyof CompetitionFormValues, "beltIds" | "countyIds">;
  label: string;
};

export function FormTextField({ control, name, label, ...input }: FieldProps & Omit<ComponentProps<"input">, "id" | "name">) {
  return <ControlledTextField control={control} name={name} label={label} {...input} />;
}

export function FormTextAreaField({ control, name, label, ...input }: FieldProps & Omit<ComponentProps<"textarea">, "id" | "name">) {
  return <ControlledTextAreaField control={control} name={name} label={label} {...input} />;
}

export function FormSelectField({ control, name, label, items }: FieldProps & { items: Record<string, React.ReactNode> }) {
  return <ControlledSelectField control={control} name={name} label={label} items={items} />;
}

export function FormDateField({ control, name, label }: FieldProps) {
  return <ControlledDateField control={control} name={name} label={label} />;
}
