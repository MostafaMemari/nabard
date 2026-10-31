"use client";

import { type DataTableColumn, DeadlineChip, StatusBadge } from "@/components/shared";
import { ageCategoryLabel, type Belt, genderLabels } from "@/features/base-data";
import { disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";

export function competitionsColumns(options: {
  belts: Belt[];
  registrationCount: (competitionId: string) => number;
}): DataTableColumn<Competition>[] {
  const { belts, registrationCount } = options;

  return [
    {
      id: "title",
      header: "عنوان",
      cell: (row) => (
        <div className="flex min-w-44 flex-col leading-tight">
          <span className="font-medium">{row.title}</span>
          <span className="text-subtle text-muted-foreground">{disciplineLabels[row.discipline]}</span>
        </div>
      ),
      sortValue: (row) => row.title,
    },
    { id: "age", header: "رده سنی", cell: (row) => ageCategoryLabel(row.ageCategoryId) },
    { id: "gender", header: "جنسیت", cell: (row) => genderLabels[row.gender] },
    { id: "belts", header: "کمربندها", cell: (row) => <BeltChips belts={belts} ids={row.beltIds} /> },
    {
      id: "deadline",
      header: "مهلت ثبت‌نام",
      cell: (row) => <DeadlineChip deadline={row.registrationDeadline} />,
      sortValue: (row) => row.registrationDeadline,
    },
    {
      id: "registrations",
      header: "ثبت‌نام‌ها",
      cell: (row) => registrationCount(row.id),
      align: "end",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.status} /> },
  ];
}
