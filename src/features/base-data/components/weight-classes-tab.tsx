"use client";

import { useState } from "react";
import { EmptyState, ErrorBanner, ScreenSpinner } from "@/components/shared";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgeCategoryAdmin } from "../api-admin";
import { useWeightClassSet } from "../hooks/use-base-data-admin";
import type { Gender } from "../types";
import { WeightSetEditor } from "./weight-set-editor";
import { rowOfAdmin } from "./weight-set-row";

const genderItems = { MALE: "پسر", FEMALE: "دختر" };

function Selector({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={items}
        value={value !== "" ? value : null}
        onValueChange={(next) => {
          if (next !== null) onChange(String(next));
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
    </Field>
  );
}

export function WeightClassesTab({ ageCategories }: { ageCategories: AgeCategoryAdmin[] }) {
  const [ageCategoryId, setAgeCategoryId] = useState("");
  const [gender, setGender] = useState("");

  const selected = ageCategoryId !== "" && gender !== "";
  const set = useWeightClassSet(selected ? { ageCategoryId, gender: gender as Gender } : null);

  const categoryItems = Object.fromEntries(
    ageCategories.map((category) => [category.id, category.isActive ? category.label : `${category.label} (بایگانی)`]),
  );

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">رده های وزنی</h2>
        <p className="text-subtle mt-0.5 text-muted-foreground">
          رده های وزنی هر رده سنی و جنسیت را به صورت یک مجموعه مرتب ویرایش کنید؛ مرز رده ها نباید وزنی را بدون رده یا با دو رده باقی بگذارد.
        </p>
      </header>
      <div className="flex flex-col gap-5 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector label="رده سنی" value={ageCategoryId} items={categoryItems} onChange={setAgeCategoryId} />
          <Selector label="جنسیت" value={gender} items={genderItems} onChange={setGender} />
        </div>

        {!selected ? (
          <EmptyState title="یک رده سنی و جنسیت انتخاب کنید تا رده های وزنی آن نمایش داده شود." />
        ) : set.isLoading ? (
          <ScreenSpinner />
        ) : set.error ? (
          <ErrorBanner message="دریافت رده های وزنی انجام نشد." onRetry={() => void set.mutate()} />
        ) : (
          <WeightSetEditor
            key={`${ageCategoryId}:${gender}`}
            ageCategoryId={ageCategoryId}
            gender={gender as Gender}
            initialRows={set.rows.map(rowOfAdmin)}
            onSaved={() => void set.mutate()}
          />
        )}
      </div>
    </section>
  );
}
