"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import { Avatar, BeltChip } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import type { Belt } from "@/features/base-data";
import type { Student } from "@/features/students";
import { formatNumber } from "@/lib/format";
import type { EligibilityResult } from "../server/eligibility";

export type SelectionRow = {
  student: Student;
  belt: Belt | null;
  eligibility: EligibilityResult;
  registered: boolean;
  weightClassLabel: string | null;
};

function SelectionItem({ row, selected, onToggle }: { row: SelectionRow; selected: boolean; onToggle: () => void }) {
  const disabled = row.registered || !row.eligibility.eligible;

  return (
    <label
      htmlFor={`select-${row.student.id}`}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
        disabled ? "cursor-default opacity-60" : "cursor-pointer",
      )}
    >
      <Checkbox id={`select-${row.student.id}`} checked={selected} disabled={disabled} onCheckedChange={() => onToggle()} />
      <Avatar id={row.student.id} name={row.student.fullName} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{row.student.fullName}</span>
          {row.registered ? (
            <span className="inline-flex h-6 items-center rounded-full bg-pending-bg px-2.5 text-subtle font-medium text-pending">
              ثبت‌نام شده
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
      {row.eligibility.eligible && row.student.weightKg !== null ? (
        <span className="text-subtle hidden whitespace-nowrap text-muted-foreground sm:block">
          {formatNumber(row.student.weightKg)} کیلوگرم
        </span>
      ) : null}
    </label>
  );
}

function SelectionGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">({formatNumber(count)})</span>
      </h3>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">{children}</div>
    </section>
  );
}

export function StudentSelectionList({
  rows,
  selectedIds,
  onToggle,
}: {
  rows: SelectionRow[];
  selectedIds: string[];
  onToggle: (studentId: string) => void;
}) {
  const selectable = rows.filter((row) => row.eligibility.eligible);
  const ineligible = rows.filter((row) => !row.eligibility.eligible);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">هنوز هنرجویی اضافه نکرده‌اید.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {selectable.length > 0 ? (
        <SelectionGroup title="واجد شرایط" count={selectable.length}>
          {selectable.map((row) => (
            <SelectionItem
              key={row.student.id}
              row={row}
              selected={selectedIds.includes(row.student.id)}
              onToggle={() => onToggle(row.student.id)}
            />
          ))}
        </SelectionGroup>
      ) : null}
      {ineligible.length > 0 ? (
        <SelectionGroup title="واجد شرایط نیستند" count={ineligible.length}>
          {ineligible.map((row) => (
            <SelectionItem key={row.student.id} row={row} selected={false} onToggle={() => onToggle(row.student.id)} />
          ))}
        </SelectionGroup>
      ) : null}
    </div>
  );
}
