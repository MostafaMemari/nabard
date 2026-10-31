"use client";

import type { ReactNode } from "react";
import { type Control, Controller } from "react-hook-form";
import { JalaliDateField } from "@/components/shared";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompetitionFormValues } from "../schemas";

type FieldProps = {
  control: Control<CompetitionFormValues>;
  name: Exclude<keyof CompetitionFormValues, "beltIds">;
  label: string;
};

export function FormTextField({ control, name, label, ...input }: FieldProps & Omit<React.ComponentProps<typeof Input>, "id" | "name">) {
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

export function FormSelectField({ control, name, label, items }: FieldProps & { items: Record<string, ReactNode> }) {
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

export function FormDateField({ control, name, label }: FieldProps) {
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
