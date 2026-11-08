"use client";

import { Switch } from "@/components/ui/switch";
import { formatJalaliDateTime } from "@/lib/format";
import type { EventDayRow } from "../types";

export function EventDayCheckIn({
  row,
  disabled,
  onCheckIn,
}: {
  row: EventDayRow;
  disabled: boolean;
  onCheckIn: (id: string, checkedIn: boolean) => Promise<void>;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Switch
        size="sm"
        checked={row.checkInAt !== null}
        disabled={disabled}
        aria-label={`حضور ${row.student.fullName}`}
        onCheckedChange={(checked) => onCheckIn(row.id, checked)}
      />
      {row.checkInAt ? (
        <span className="text-xs text-muted-foreground tabular-nums">{formatJalaliDateTime(new Date(row.checkInAt))}</span>
      ) : null}
    </div>
  );
}
