"use client";

import { Avatar } from "@/components/shared";
import { toPersianDigits } from "@/lib/format";
import type { EventDayRow } from "../types";
import { EventDayCheckIn } from "./event-day-check-in";
import { EventDayVerdict } from "./event-day-verdict";
import { EventDayWeightInput } from "./event-day-weight-input";

type EventDayCardsProps = {
  rows: EventDayRow[];
  kyorugi: boolean;
  busyId: string | null;
  onWeigh: (id: string, weightKg: number) => Promise<void>;
  onCheckIn: (id: string, checkedIn: boolean) => Promise<void>;
};

export function EventDayCards({ rows, kyorugi, busyId, onWeigh, onCheckIn }: EventDayCardsProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar id={row.student.id} name={row.student.fullName} size="md" />
              <div className="flex flex-col">
                <span className="font-medium">{row.student.fullName}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{toPersianDigits(row.student.nationalCode)}</span>
              </div>
            </div>
            {kyorugi ? <EventDayVerdict row={row} compact /> : null}
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <p className="text-muted-foreground">
              مربی: <span className="text-foreground">{row.coachName}</span>
            </p>
            {kyorugi ? (
              <p className="text-muted-foreground">
                رده وزنی: <span className="text-foreground tabular-nums">{row.weightClassLabel ?? "—"}</span>
              </p>
            ) : null}
          </div>

          <div className={kyorugi ? "flex items-center justify-between gap-3" : "flex items-center justify-end"}>
            {kyorugi ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                وزن واقعی
                <EventDayWeightInput row={row} disabled={busyId === row.id} onWeigh={onWeigh} />
              </div>
            ) : null}
            <EventDayCheckIn row={row} disabled={busyId === row.id} onCheckIn={onCheckIn} />
          </div>
        </div>
      ))}
    </div>
  );
}
