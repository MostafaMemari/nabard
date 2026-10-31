"use client";

import { Trash2Icon } from "lucide-react";
import { Avatar, BeltChip } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import { formatNumber } from "@/lib/format";
import type { Student } from "../types";

export function StudentCardList({
  rows,
  onEdit,
  onDelete,
}: {
  rows: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  const { belts } = useBelts();

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {rows.map((student) => {
        const belt = belts.find((item) => item.id === student.beltId);
        return (
          <div key={student.id} className="flex items-center gap-2 border-b border-border px-4 py-3 last:border-b-0">
            <button
              type="button"
              onClick={() => onEdit(student)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-start"
            >
              <Avatar id={student.id} name={student.fullName} size="md" />
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="truncate text-sm font-medium">{student.fullName}</span>
                <span className="flex flex-wrap items-center gap-2">
                  {belt ? <BeltChip belt={belt} /> : null}
                  <span className="text-subtle text-muted-foreground">
                    {student.weightKg !== null ? `${formatNumber(student.weightKg)} کیلوگرم` : "وزن ثبت نشده"}
                  </span>
                </span>
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`حذف ${student.fullName}`}
              onClick={() => onDelete(student)}
            >
              <Trash2Icon />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
