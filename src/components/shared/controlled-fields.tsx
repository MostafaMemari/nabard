"use client";

import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldBody, type SharedFieldProps } from "./field-body";

export function ControlledTextField<T extends FieldValues>({
  control,
  name,
  label,
  ...input
}: SharedFieldProps<T> & Omit<React.ComponentProps<typeof Input>, "id" | "name">) {
  return (
    <FieldBody control={control} name={name} label={label}>
      {({ value, onChange }) => <Input id={name} value={value} onChange={onChange} {...input} />}
    </FieldBody>
  );
}

export function ControlledTextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  ...input
}: SharedFieldProps<T> & Omit<React.ComponentProps<typeof Textarea>, "id" | "name">) {
  return (
    <FieldBody control={control} name={name} label={label}>
      {({ value, onChange }) => <Textarea id={name} value={value} onChange={onChange} {...input} />}
    </FieldBody>
  );
}

export function ControlledSelectField<T extends FieldValues>({
  control,
  name,
  label,
  items,
}: SharedFieldProps<T> & { items: Record<string, ReactNode> }) {
  return (
    <FieldBody control={control} name={name} label={label}>
      {({ value, onChange }) => (
        <Select
          items={items}
          value={value !== "" ? value : null}
          onValueChange={(next) => {
            if (next !== null) {
              onChange(String(next));
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
      )}
    </FieldBody>
  );
}
