"use client";

import { SelectionGroup, SelectionItem } from "./selection-item";
import type { SelectionRow } from "./selection-row";

export type { SelectionRow } from "./selection-row";

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
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">هنوز هنرجویی اضافه نکرده اید.</p>
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
