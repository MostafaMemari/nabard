"use client";

import type { WeightClass } from "@/features/base-data";
import { disciplineLabels } from "../labels";
import { WeightClassTable } from "./weight-class-table";

export function WeightClassHint({ visible, classes, isLoading }: { visible: boolean; classes: WeightClass[]; isLoading: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-primary-subtle/60 p-3">
      <p className="text-subtle text-muted-foreground">
        رده‌های وزنی {disciplineLabels.KYORUGI} برای رده سنی و جنسیت انتخاب‌شده به‌صورت خودکار تعیین می‌شود:
      </p>
      <WeightClassTable classes={classes} isLoading={isLoading} />
    </div>
  );
}
