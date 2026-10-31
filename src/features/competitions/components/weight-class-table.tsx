"use client";

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

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">رده وزنی</TableHead>
            <TableHead>بازه وزن</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((weightClass) => (
            <TableRow key={weightClass.id}>
              <TableCell className="font-medium">{toPersianDigits(weightClass.label)}</TableCell>
              <TableCell className="text-subtle text-muted-foreground">{rangeLabel(weightClass)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
