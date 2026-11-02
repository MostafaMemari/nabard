"use client";

import { cn } from "cn";
import { useNow } from "@/lib/use-now";

const DAY_MS = 86_400_000;

function tone(remaining: number): string {
  if (remaining < DAY_MS) return "bg-danger";
  if (remaining <= 3 * DAY_MS) return "bg-warning";
  return "bg-primary";
}

export function DeadlineProgress({ startedAt, deadline, className }: { startedAt: string; deadline: string; className?: string }) {
  const now = useNow();
  if (now === null) {
    return null;
  }
  const startMs = new Date(startedAt).getTime();
  const deadlineMs = new Date(deadline).getTime();
  const progress = Math.min(100, Math.max(0, ((now.getTime() - startMs) / (deadlineMs - startMs)) * 100));

  return (
    <div aria-hidden className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)} dir="ltr">
      <div
        className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear", tone(deadlineMs - now.getTime()))}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
