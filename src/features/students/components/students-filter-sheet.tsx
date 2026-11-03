"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { BeltDot } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { AgeCategory, Belt } from "@/features/base-data";
import { formatNumber } from "@/lib/format";
import { useStudentFilterCounts } from "../hooks/use-student-filter-counts";
import type { Student } from "../types";
import { Chip, chipCount } from "./students-filter-chip";

// Tap-to-open filter sheet for the students list: age category and belt as two
// chip groups whose counts cross-guide each other.
export function StudentsFilterSheet({
  students,
  belts,
  ageCategories,
  beltId,
  ageCategoryId,
  onBeltChange,
  onAgeCategoryChange,
  resultCount,
}: {
  students: Student[];
  belts: Belt[];
  ageCategories: AgeCategory[];
  beltId: string;
  ageCategoryId: string;
  onBeltChange: (id: string) => void;
  onAgeCategoryChange: (id: string) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const selectedBelt = belts.find((belt) => belt.id === beltId);
  const selectedCategory = ageCategories.find((category) => category.id === ageCategoryId);
  const activeCount = (selectedBelt ? 1 : 0) + (selectedCategory ? 1 : 0);
  const { beltCounts, ageCounts } = useStudentFilterCounts({ students, ageCategories, beltId, ageCategoryId });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
        <SlidersHorizontalIcon data-icon="inline-start" />
        فیلترها
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
            {formatNumber(activeCount)}
          </span>
        ) : null}
      </Button>
      <SheetContent side="bottom" className="mx-auto max-w-content gap-0 rounded-t-2xl" aria-label="فیلتر هنرجویان">
        <div className="border-b border-border px-5 pb-3 pt-4">
          <SheetTitle>فیلتر هنرجویان</SheetTitle>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
          <section className="flex flex-col gap-2">
            <h3 className="text-subtle text-muted-foreground">رده سنی</h3>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={ageCategoryId === "all"} onClick={() => onAgeCategoryChange("all")}>
                همه
                {chipCount(ageCategoryId === "all", ageCounts.all)}
              </Chip>
              {ageCategories.map((category) => (
                <Chip key={category.id} active={category.id === ageCategoryId} onClick={() => onAgeCategoryChange(category.id)}>
                  {category.label}
                  {chipCount(category.id === ageCategoryId, ageCounts[category.id] ?? 0)}
                </Chip>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-subtle text-muted-foreground">کمربند</h3>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={beltId === "all"} onClick={() => onBeltChange("all")}>
                همه کمربندها
                {chipCount(beltId === "all", beltCounts.all)}
              </Chip>
              {belts.map((belt) => (
                <Chip key={belt.id} active={belt.id === beltId} onClick={() => onBeltChange(belt.id)}>
                  <BeltDot code={belt.code} />
                  {belt.label}
                  {chipCount(belt.id === beltId, beltCounts[belt.id] ?? 0)}
                </Chip>
              ))}
            </div>
          </section>
        </div>
        <footer className="mt-auto flex items-center justify-between gap-2 border-t px-5 py-4">
          <span className="text-subtle text-muted-foreground">{formatNumber(resultCount)} هنرجو</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={activeCount === 0}
              onClick={() => {
                onBeltChange("all");
                onAgeCategoryChange("all");
              }}
            >
              حذف فیلترها
            </Button>
            <SheetClose render={<Button type="button">نمایش نتایج</Button>} />
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
