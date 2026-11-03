"use client";

import { Trash2Icon } from "lucide-react";
import { Avatar, BeltChip, MobileCard, MobileCardChips } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
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
    <div className="flex flex-col gap-3">
      {rows.map((student) => {
        const belt = belts.find((item) => item.id === student.beltId);
        return (
          <MobileCard key={student.id} className="gap-0 p-0">
            <button
              type="button"
              onClick={() => onEdit(student)}
              className="flex min-h-11 w-full items-center gap-3 rounded-t-xl p-4 pb-3 text-start transition-colors duration-150 hover:bg-muted/50 active:bg-muted"
            >
              <Avatar id={student.id} name={student.fullName} size="md" src={student.photoUrl ?? undefined} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{student.fullName}</span>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
              <MobileCardChips>{belt ? <BeltChip belt={belt} /> : null}</MobileCardChips>
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-danger hover:bg-danger-bg hover:text-danger"
                aria-label={`حذف ${student.fullName}`}
                onClick={() => onDelete(student)}
              >
                <Trash2Icon data-icon="inline-start" />
                حذف
              </Button>
            </div>
          </MobileCard>
        );
      })}
    </div>
  );
}
