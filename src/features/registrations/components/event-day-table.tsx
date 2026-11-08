"use client";

import { Avatar } from "@/components/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";
import type { EventDayRow } from "../types";
import { EventDayCheckIn } from "./event-day-check-in";
import { EventDayVerdict } from "./event-day-verdict";
import { EventDayWeightInput } from "./event-day-weight-input";

type EventDayTableProps = {
  rows: EventDayRow[];
  kyorugi: boolean;
  busyId: string | null;
  onWeigh: (id: string, weightKg: number) => Promise<void>;
  onCheckIn: (id: string, checkedIn: boolean) => Promise<void>;
};

export function EventDayTable({ rows, kyorugi, busyId, onWeigh, onCheckIn }: EventDayTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>هنرجو</TableHead>
          <TableHead>مربی</TableHead>
          {kyorugi ? <TableHead>رده وزنی</TableHead> : null}
          {kyorugi ? <TableHead>وزن واقعی</TableHead> : null}
          {kyorugi ? <TableHead>وضعیت توزین</TableHead> : null}
          <TableHead>حضور</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <Avatar id={row.student.id} name={row.student.fullName} size="sm" />
                <div className="flex flex-col">
                  <span className="font-medium">{row.student.fullName}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{toPersianDigits(row.student.nationalCode)}</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-subtle text-muted-foreground">{row.coachName}</TableCell>
            {kyorugi ? <TableCell className="tabular-nums">{row.weightClassLabel ?? "—"}</TableCell> : null}
            {kyorugi ? (
              <TableCell>
                <EventDayWeightInput row={row} disabled={busyId === row.id} onWeigh={onWeigh} />
              </TableCell>
            ) : null}
            {kyorugi ? (
              <TableCell>
                <EventDayVerdict row={row} />
              </TableCell>
            ) : null}
            <TableCell>
              <EventDayCheckIn row={row} disabled={busyId === row.id} onCheckIn={onCheckIn} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
