"use client";

import { type DataTableColumn, DeadlineChip, IconTile, StatusBadge } from "@/components/shared";
import { ageCategoryLabel, type Belt, genderLabels } from "@/features/base-data";
import { disciplineIcons, disciplineLabels } from "../labels";
import type { Competition } from "../types";
import { BeltChips } from "./belt-chips";
import { CountyChip } from "./county-chip";

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
        <div className="flex items-center gap-2.5">
          <IconTile icon={disciplineIcons[row.discipline]} size="sm" />
          <div className="flex min-w-36 flex-col leading-tight">
            <span className="font-medium">{row.title}</span>
            <span className="text-subtle text-muted-foreground">{disciplineLabels[row.discipline]}</span>
            {row.level === "COUNTY" && row.hostCountyName ? (
              <span className="mt-1 w-fit">
                <CountyChip name={row.hostCountyName} />
              </span>
            ) : null}
          </div>
        </div>
      ),
      sortValue: (row) => row.title,
    },
    { id: "age", header: "رده سنی", cell: (row) => ageCategoryLabel(row.ageCategoryId), minScreen: "lg" },
    { id: "gender", header: "جنسیت", cell: (row) => genderLabels[row.gender], minScreen: "xl" },
    { id: "belts", header: "کمربندها", cell: (row) => <BeltChips belts={belts} ids={row.beltIds} />, minScreen: "xl" },
    {
      id: "deadline",
      header: "مهلت ثبت نام",
      cell: (row) => <DeadlineChip deadline={row.registrationDeadline} />,
      sortValue: (row) => row.registrationDeadline,
    },
    {
      id: "registrations",
      header: "ثبت نام ها",
      cell: (row) => registrationCount(row.id),
      align: "end",
      minScreen: "lg",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={row.status} /> },
  ];
}
