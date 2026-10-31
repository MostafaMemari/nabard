"use client";

import { Avatar, BeltChip } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBelts } from "@/features/base-data";
import type { Student } from "@/features/students";
import { formatJalaliDate, formatNumber } from "@/lib/format";

export function CoachStudentsTable({ students, isLoading }: { students: Student[]; isLoading: boolean }) {
  const { belts } = useBelts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {["s1", "s2", "s3"].map((id) => (
          <Skeleton key={id} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return <p className="text-subtle text-muted-foreground">این مربی هنوز هنرجویی اضافه نکرده است.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>هنرجو</TableHead>
            <TableHead>کمربند</TableHead>
            <TableHead>وزن</TableHead>
            <TableHead>تاریخ تولد</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const belt = belts.find((item) => item.id === student.beltId);
            return (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar id={student.id} name={student.fullName} size="sm" />
                    <span className="text-sm font-medium">{student.fullName}</span>
                  </div>
                </TableCell>
                <TableCell>{belt ? <BeltChip belt={belt} /> : "—"}</TableCell>
                <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                  {student.weightKg !== null ? `${formatNumber(student.weightKg)} کیلوگرم` : "—"}
                </TableCell>
                <TableCell className="text-subtle whitespace-nowrap text-muted-foreground">
                  {formatJalaliDate(new Date(student.birthDate))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
