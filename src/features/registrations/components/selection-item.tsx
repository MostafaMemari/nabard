"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { Avatar, BeltChip } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatNumber, toPersianDigits } from "@/lib/format";
import type { SelectionRow } from "./selection-row";

export function SelectionItem({
  row,
  selected,
  onToggle,
  requiresWeight,
  weight,
  onWeightChange,
}: {
  row: SelectionRow;
  selected: boolean;
  onToggle: () => void;
  requiresWeight?: boolean;
  weight?: string;
  onWeightChange?: (studentId: string, value: string) => void;
}) {
  const disabled = row.registered || !row.eligibility.eligible;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-colors duration-150",
        selected ? "border-primary bg-primary-subtle" : "border-border bg-card shadow-card",
        !disabled && "hover:border-ring/40",
        disabled && "shadow-none",
        disabled && !row.registered && "opacity-60",
      )}
    >
      <label htmlFor={`select-${row.student.id}`} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <Checkbox id={`select-${row.student.id}`} checked={selected} disabled={disabled} onCheckedChange={() => onToggle()} />
        <Avatar id={row.student.id} name={row.student.fullName} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium">{row.student.fullName}</span>
            {row.registered ? (
              <span className="inline-flex h-6 items-center rounded-full bg-pending-bg px-2.5 text-subtle font-medium text-pending">
                ثبت نام شده
              </span>
            ) : null}
          </span>
          {row.eligibility.eligible ? (
            <span className="flex flex-wrap items-center gap-2">
              {row.belt ? <BeltChip belt={row.belt} /> : null}
              {row.weightClassLabel ? <span className="text-subtle text-muted-foreground">{row.weightClassLabel}</span> : null}
            </span>
          ) : (
            <span className="text-subtle text-muted-foreground">{row.eligibility.reason}</span>
          )}
        </div>
      </label>
      {requiresWeight ? (
        <div className="flex shrink-0 flex-col gap-1">
          <span className="text-subtle text-muted-foreground">وزن (کیلوگرم)</span>
          <Input
            dir="ltr"
            inputMode="decimal"
            className="h-9 w-24 tabular-nums"
            value={weight ?? ""}
            placeholder={toPersianDigits("۵۴٫۵")}
            aria-label={`وزن ${row.student.fullName}`}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onWeightChange?.(row.student.id, event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

export function SelectionGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">({formatNumber(count)})</span>
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
