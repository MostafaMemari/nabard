"use client";

import type { Control } from "react-hook-form";
import { FormSection } from "@/components/shared";
import { BeltChip } from "@/components/shared/belt-chip";
import { ageCategoryLabels, type Belt, genderLabels } from "@/features/base-data";
import type { CompetitionFormValues } from "../schemas";
import { FormSelectField } from "./form-fields";

export function ParticipantsSection({
  control,
  belts,
  children,
}: {
  control: Control<CompetitionFormValues>;
  belts: Belt[];
  children?: React.ReactNode;
}) {
  const ageItems = Object.fromEntries(
    (["BLOSSOM", "YOUTH", "CADET", "JUNIOR", "YOUNG", "SENIOR", "ULTRA"] as const).map((name) => [
      name.toLowerCase(),
      ageCategoryLabels[name],
    ]),
  );
  const beltItems = Object.fromEntries(belts.map((belt) => [belt.id, <BeltChip key={belt.id} belt={belt} />]));

  return (
    <FormSection title="شرکت‌کنندگان" description="جنسیت و بازه سنی و کمربندی مجاز برای شرکت در مسابقه.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelectField control={control} name="gender" label="جنسیت" items={genderLabels} />
        <FormSelectField control={control} name="ageCategoryId" label="رده سنی" items={ageItems} />
        <FormSelectField control={control} name="minBeltId" label="کمربند ابتدایی" items={beltItems} />
        <FormSelectField control={control} name="maxBeltId" label="کمربند پایانی" items={beltItems} />
      </div>
      {children}
    </FormSection>
  );
}
