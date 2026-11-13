"use client";

import { UsersIcon } from "lucide-react";
import { EmptyState } from "@/components/shared";
import { SelectionGroup } from "./selection-group";
import { SelectionItem } from "./selection-item";
import type { SelectionRow } from "./selection-row";

export type { SelectionRow } from "./selection-row";

export function StudentSelectionList({
  rows,
  selectedIds,
  onToggle,
  requiresWeight,
  weights,
  onWeightChange,
}: {
  rows: SelectionRow[];
  selectedIds: string[];
  onToggle: (studentId: string) => void;
  requiresWeight?: boolean;
  weights?: Record<string, string>;
  onWeightChange?: (studentId: string, value: string) => void;
}) {
  const selectable = rows.filter((row) => row.eligibility.eligible);
  const ineligible = rows.filter((row) => !row.eligibility.eligible);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState icon={UsersIcon} title="هنوز هنرجویی اضافه نکرده اید" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {requiresWeight ? (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-subtle text-muted-foreground">
          برای ثبت نام کیوروگی، وزن هر هنرجو را وارد کنید تا رده وزنی او مشخص شود
        </p>
      ) : null}
      {selectable.length > 0 ? (
        <SelectionGroup title="واجد شرایط" count={selectable.length}>
          {selectable.map((row) => (
            <SelectionItem
              key={row.student.id}
              row={row}
              selected={selectedIds.includes(row.student.id)}
              onToggle={() => onToggle(row.student.id)}
              requiresWeight={requiresWeight}
              weight={weights?.[row.student.id] ?? ""}
              onWeightChange={onWeightChange}
            />
          ))}
        </SelectionGroup>
      ) : null}
      {ineligible.length > 0 ? (
        <SelectionGroup title="واجد شرایط نیستند" count={ineligible.length}>
          {ineligible.map((row) => (
            <SelectionItem
              key={row.student.id}
              row={row}
              selected={false}
              onToggle={() => onToggle(row.student.id)}
              requiresWeight={requiresWeight}
              weight={weights?.[row.student.id] ?? ""}
              onWeightChange={onWeightChange}
            />
          ))}
        </SelectionGroup>
      ) : null}
    </div>
  );
}
