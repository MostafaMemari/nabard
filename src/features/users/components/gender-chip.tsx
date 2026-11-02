"use client";

import { cn } from "cn";
import { personGenderLabels } from "@/features/base-data/labels";
import type { Gender } from "@/generated/enums";

export function GenderChip({ gender, className }: { gender: Gender | null; className?: string }) {
  if (gender === null) {
    return (
      <span
        className={cn(
          "inline-flex h-6 w-fit items-center rounded-full bg-warning-bg px-2.5 text-subtle font-medium text-warning",
          className,
        )}
      >
        جنسیت ثبت نشده
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center rounded-full border border-border bg-card px-2.5 text-subtle font-medium",
        className,
      )}
    >
      {personGenderLabels[gender]}
    </span>
  );
}
