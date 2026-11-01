"use client";

import { Avatar, BeltChip, DataTable, type DataTableColumn, SkeletonRows } from "@/components/shared";
import { useBelts } from "@/features/base-data";
import type { Student } from "@/features/students";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { CoachStudentCard } from "./coach-student-card";

export function CoachStudentsTable({ students, isLoading }: { students: Student[]; isLoading: boolean }) {
  const { belts } = useBelts();

  const columns: DataTableColumn<Student>[] = [
    {
      id: "name",
      header: "هنرجو",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.id} name={row.fullName} size="sm" />
          <span className="font-medium">{row.fullName}</span>
        </div>
      ),
      sortValue: (row) => row.fullName,
    },
    {
      id: "belt",
      header: "کمربند",
      cell: (row) => {
        const belt = belts.find((item) => item.id === row.beltId);
        return belt ? <BeltChip belt={belt} /> : "-";
      },
      minScreen: "lg",
    },
    {
      id: "weight",
      header: "وزن",
      cell: (row) => (
        <span className="text-subtle whitespace-nowrap text-muted-foreground tabular-nums">
          {row.weightKg !== null ? `${formatNumber(row.weightKg)} کیلوگرم` : "-"}
        </span>
      ),
      align: "end",
      sortValue: (row) => row.weightKg ?? 0,
      minScreen: "lg",
    },
    {
      id: "birthDate",
      header: "تاریخ تولد",
      cell: (row) => (
        <span className="text-subtle whitespace-nowrap text-muted-foreground">{formatJalaliDate(new Date(row.birthDate))}</span>
      ),
      sortValue: (row) => row.birthDate,
      minScreen: "xl",
    },
  ];

  if (isLoading) {
    return <SkeletonRows rows={3} className="h-12" />;
  }

  if (students.length === 0) {
    return <p className="text-subtle text-muted-foreground">این مربی هنوز هنرجویی اضافه نکرده است.</p>;
  }

  return (
    <DataTable
      columns={columns}
      rows={students}
      getRowId={(row) => row.id}
      renderCard={(row) => <CoachStudentCard student={row} belts={belts} />}
    />
  );
}
