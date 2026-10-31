"use client";

import { cn } from "cn";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { useNow } from "@/lib/use-now";

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const THREE_DAYS_MS = 3 * DAY_MS;

function remainingLabel(remaining: number): string {
  if (remaining < HOUR_MS) {
    return `${toPersianDigits(Math.max(1, Math.floor(remaining / MINUTE_MS)))} دقیقه مانده`;
  }
  if (remaining < DAY_MS) {
    const hours = Math.floor(remaining / HOUR_MS);
    const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);
    return minutes > 0
      ? `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه مانده`
      : `${toPersianDigits(hours)} ساعت مانده`;
  }
  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  return hours > 0 ? `${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت مانده` : `${toPersianDigits(days)} روز مانده`;
}

function state(remaining: number): { class: string; passed: boolean } {
  if (remaining < 0) {
    return { class: "bg-pending-bg text-muted-foreground", passed: true };
  }
  if (remaining < DAY_MS) {
    return { class: "bg-danger-bg text-danger", passed: false };
  }
  if (remaining <= THREE_DAYS_MS) {
    return { class: "bg-warning-bg text-warning", passed: false };
  }
  return { class: "bg-primary-subtle text-primary", passed: false };
}

export function CountdownChip({ deadline, className }: { deadline: string; className?: string }) {
  const now = useNow();
  const remaining = now === null ? null : new Date(deadline).getTime() - now.getTime();
  const current = state(remaining ?? Number.POSITIVE_INFINITY);

  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-subtle font-medium whitespace-nowrap tabular-nums",
        current.class,
        className,
      )}
    >
      {!current.passed && remaining !== null && remaining < DAY_MS ? (
        <span aria-hidden className="size-1.5 rounded-full bg-current animate-pulse motion-reduce:animate-none" />
      ) : null}
      {remaining === null ? formatJalaliDate(new Date(deadline)) : remaining < 0 ? "مهلت ثبت‌نام تمام شد" : remainingLabel(remaining)}
    </span>
  );
}
