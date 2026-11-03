"use client";

import { XIcon } from "lucide-react";
import { BeltDot } from "@/components/shared";
import type { AgeCategory, Belt } from "@/features/base-data";

// Removable chips under the toolbar that make the active filters visible
// without opening the sheet again.
export function StudentsActiveFilters({
  belts,
  ageCategories,
  beltId,
  ageCategoryId,
  onBeltChange,
  onAgeCategoryChange,
}: {
  belts: Belt[];
  ageCategories: AgeCategory[];
  beltId: string;
  ageCategoryId: string;
  onBeltChange: (id: string) => void;
  onAgeCategoryChange: (id: string) => void;
}) {
  const selectedBelt = belts.find((belt) => belt.id === beltId);
  const selectedCategory = ageCategories.find((category) => category.id === ageCategoryId);

  if (!selectedBelt && !selectedCategory) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selectedCategory ? (
        <button
          type="button"
          aria-label={`حذف فیلتر رده سنی ${selectedCategory.label}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-subtle px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary-subtle/70"
          onClick={() => onAgeCategoryChange("all")}
        >
          رده سنی: {selectedCategory.label}
          <XIcon aria-hidden className="size-3.5" />
        </button>
      ) : null}
      {selectedBelt ? (
        <button
          type="button"
          aria-label={`حذف فیلتر کمربند ${selectedBelt.label}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-subtle px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary-subtle/70"
          onClick={() => onBeltChange("all")}
        >
          <BeltDot code={selectedBelt.code} />
          کمربند: {selectedBelt.label}
          <XIcon aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
