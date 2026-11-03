"use client";

import { cn } from "cn";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { BeltDot } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { AgeCategory, Belt } from "@/features/base-data";
import { formatNumber } from "@/lib/format";
import { birthDateInAgeCategory } from "../student-age";
import type { Student } from "../types";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors duration-150 md:h-9",
        active
          ? "border-primary/30 bg-primary-subtle font-medium text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function chipCount(active: boolean, count: number): ReactNode {
  return <span className={cn("text-xs tabular-nums", active ? "opacity-70" : "text-muted-foreground")}>{formatNumber(count)}</span>;
}

// Tap-to-open filter sheet for the students list: age category and belt as two
// chip groups. Each group counts within the other's current selection so the
// two dimensions guide each other instead of showing dead ends.
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

  const matchesAge = (student: Student) => (selectedCategory ? birthDateInAgeCategory(student.birthDate, selectedCategory) : true);
  const matchesBelt = (student: Student) => (selectedBelt ? student.beltId === selectedBelt.id : true);

  const beltCounts: Record<string, number> = { all: 0 };
  const ageCounts: Record<string, number> = { all: 0 };
  for (const student of students) {
    if (matchesAge(student)) {
      beltCounts.all += 1;
      beltCounts[student.beltId] = (beltCounts[student.beltId] ?? 0) + 1;
    }
    if (matchesBelt(student)) {
      ageCounts.all += 1;
      for (const category of ageCategories) {
        if (birthDateInAgeCategory(student.birthDate, category)) {
          ageCounts[category.id] = (ageCounts[category.id] ?? 0) + 1;
        }
      }
    }
  }

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
