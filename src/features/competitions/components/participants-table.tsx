"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Participant } from "@/features/registrations";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";

const columns = ["ردیف", "نام و نام خانوادگی", "کد ملی", "تاریخ تولد", "کمربند", "مربی"];

export function ParticipantsTable({ participants }: { participants: Participant[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border print:rounded-none print:border-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 print:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant, index) => (
            <TableRow key={participant.registrationId} className="print:break-inside-avoid">
              <TableCell className="text-subtle tabular-nums text-muted-foreground">{toPersianDigits(index + 1)}</TableCell>
              <TableCell className="font-medium whitespace-nowrap">{participant.fullName}</TableCell>
              <TableCell className="tabular-nums">{toPersianDigits(participant.nationalCode)}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{formatJalaliDate(new Date(participant.birthDate))}</TableCell>
              <TableCell className="whitespace-nowrap">{participant.beltLabel}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{participant.coachName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
