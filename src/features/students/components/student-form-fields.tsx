"use client";

import type { ReactNode } from "react";
import { type Control, Controller } from "react-hook-form";
import { BeltDot, beltLabel, JalaliDateField } from "@/components/shared";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Belt } from "@/features/base-data";
import type { StudentFormValues } from "../schemas";

type FieldProps = {
  control: Control<StudentFormValues>;
  name: keyof StudentFormValues;
  label: string;
};

export function StudentTextField({ control, name, label, ...input }: FieldProps & Omit<React.ComponentProps<typeof Input>, "id" | "name">) {
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

export function StudentSelectField({ control, name, label, items }: FieldProps & { items: Record<string, ReactNode> }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? "" : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <Select
            items={items}
            value={field.value !== "" ? field.value : null}
            onValueChange={(value) => {
              if (value !== null) {
                field.onChange(String(value));
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(items).map((item) => (
                <SelectItem key={item} value={item}>
                  {items[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}

export function StudentBeltField({ control, name, label, belts }: FieldProps & { belts: Belt[] }) {
  const items = Object.fromEntries(
    belts.map((belt) => [
      belt.id,
      <span key={belt.id} className="flex items-center gap-2">
        <BeltDot name={belt.name} />
        {beltLabel(belt.name)}
      </span>,
    ]),
  );

  return <StudentSelectField control={control} name={name} label={label} items={items} />;
}

export function StudentBirthDateField({ control, name, label }: FieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? "" : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <JalaliDateField value={field.value} onChange={field.onChange} />
          {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
