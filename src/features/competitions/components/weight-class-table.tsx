"use client";

import { RulerIcon } from "lucide-react";
import { EmptyState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WeightClass } from "@/features/base-data";
import { toPersianDigits } from "@/lib/format";

function rangeLabel(weightClass: WeightClass): string {
  const min = weightClass.minWeightKg === 0 ? null : `${toPersianDigits(weightClass.minWeightKg)}`;
  const max = weightClass.maxWeightKg === null ? null : `${toPersianDigits(weightClass.maxWeightKg)}`;
  if (min === null) {
    return `تا ${max} کیلوگرم`;
  }
  if (max === null) {
    return `بالای ${min} کیلوگرم`;
  }
  return `از ${min} تا ${max} کیلوگرم`;
}

export function WeightClassTable({ classes, isLoading }: { classes: WeightClass[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {["w1", "w2", "w3", "w4"].map((id) => (
          <Skeleton key={id} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return <EmptyState icon={RulerIcon} title="برای این رده سنی و جنسیت هنوز رده وزنی تعریف نشده است" />;
  }

  return (
    <>
      {/* Desktop keeps the table; the same rows degrade to a divided list on
          phones so the hint box stays readable without horizontal squeeze. */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">رده وزنی</TableHead>
              <TableHead>بازه وزن</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((weightClass, index) => (
              <TableRow key={weightClass.id}>
                <TableCell className="font-medium">
                  وزن {toPersianDigits(index + 1)} · {toPersianDigits(weightClass.label)}
                </TableCell>
                <TableCell className="text-subtle text-muted-foreground">{rangeLabel(weightClass)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y rounded-lg border border-border bg-card md:hidden">
        {classes.map((weightClass, index) => (
          <div key={weightClass.id} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
            <span className="shrink-0 text-sm font-medium">
              وزن {toPersianDigits(index + 1)} · {toPersianDigits(weightClass.label)}
            </span>
            <span className="text-subtle min-w-0 truncate text-muted-foreground">{rangeLabel(weightClass)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
