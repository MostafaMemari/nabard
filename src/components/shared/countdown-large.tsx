"use client";

import { cn } from "cn";
import { toPersianDigits } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { DeadlineProgress } from "./deadline-progress";

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function padTwo(value: number): string {
  return toPersianDigits(String(value).padStart(2, "0"));
}

function split(remaining: number) {
  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((remaining % MINUTE_MS) / 1000);
  return [days, hours, minutes, seconds].map(padTwo);
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-0.5 rounded-xl bg-muted px-3 py-3">
      <span className="text-display leading-none font-semibold tabular-nums">{value}</span>
      <span className="text-subtle text-muted-foreground">{label}</span>
    </div>
  );
}

export function CountdownLarge({ deadline, startedAt, className }: { deadline: string; startedAt: string; className?: string }) {
  const now = useNow();
  const deadlineMs = new Date(deadline).getTime();
  const remaining = now === null ? null : deadlineMs - now.getTime();

  const values = remaining === null ? ["۰۰", "۰۰", "۰۰", "۰۰"] : remaining < 0 ? ["۰۰", "۰۰", "۰۰", "۰۰"] : split(remaining);
  const passed = remaining !== null && remaining < 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {passed ? (
        <p className="text-subtle font-medium text-muted-foreground">مهلت ثبت نام تمام شد</p>
      ) : (
        <div className="flex items-stretch gap-2" dir="ltr">
          <Tile value={values[0]} label="روز" />
          <Tile value={values[1]} label="ساعت" />
          <Tile value={values[2]} label="دقیقه" />
          <Tile value={values[3]} label="ثانیه" />
        </div>
      )}
      {!passed ? <DeadlineProgress startedAt={startedAt} deadline={deadline} /> : null}
    </div>
  );
}
