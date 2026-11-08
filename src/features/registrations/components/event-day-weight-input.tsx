"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseDecimalInput } from "@/lib/format";
import type { EventDayRow } from "../types";

export function EventDayWeightInput({
  row,
  disabled,
  onWeigh,
}: {
  row: EventDayRow;
  disabled: boolean;
  onWeigh: (id: string, weightKg: number) => Promise<void>;
}) {
  const [value, setValue] = useState(row.weighInKg === null ? "" : String(row.weighInKg));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(row.weighInKg === null ? "" : String(row.weighInKg));
  }, [row.weighInKg]);

  function commit() {
    if (pending || disabled) return;

    const weight = parseDecimalInput(value);
    if (weight === null || weight === row.weighInKg) {
      setValue(row.weighInKg === null ? "" : String(row.weighInKg));
      return;
    }

    setPending(true);
    onWeigh(row.id, weight).finally(() => setPending(false));
  }

  return (
    <Input
      aria-label={`وزن واقعی ${row.student.fullName}`}
      inputMode="decimal"
      placeholder="وزن"
      value={value}
      disabled={disabled || pending}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
      className="h-9 w-24 text-center tabular-nums"
    />
  );
}
