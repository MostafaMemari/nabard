"use client";

import type { ReactNode } from "react";
import type { Control } from "react-hook-form";
import { BeltDot, ControlledDateField, ControlledSelectField, ControlledTextField } from "@/components/shared";
import type { Belt } from "@/features/base-data";
import type { StudentFormValues } from "../schemas";

type FieldProps = {
  control: Control<StudentFormValues>;
  name: keyof StudentFormValues;
  label: string;
};

export function StudentTextField({ control, name, label, ...input }: FieldProps & Omit<React.ComponentProps<"input">, "id" | "name">) {
  return <ControlledTextField control={control} name={name} label={label} {...input} />;
}

export function StudentSelectField({ control, name, label, items }: FieldProps & { items: Record<string, ReactNode> }) {
  return <ControlledSelectField control={control} name={name} label={label} items={items} />;
}

export function StudentBeltField({ control, name, label, belts }: FieldProps & { belts: Belt[] }) {
  const items = Object.fromEntries(
    belts.map((belt) => [
      belt.id,
      <span key={belt.id} className="flex items-center gap-2">
        <BeltDot code={belt.code} />
        {belt.label}
      </span>,
    ]),
  );

  return <ControlledSelectField control={control} name={name} label={label} items={items} />;
}

export function StudentBirthDateField({ control, name, label }: FieldProps) {
  return <ControlledDateField control={control} name={name} label={label} />;
}
