"use client";

import { cn } from "cn";
import { formatNumber } from "@/lib/format";

export function RequestStatusCard({
  value,
  label,
  active,
  onClick,
}: {
  value: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border bg-card p-4 text-start shadow-card transition-colors md:p-6",
        active ? "border-primary" : "border-border hover:border-primary/60",
      )}
    >
      <span className="text-display font-semibold tabular-nums">{formatNumber(value)}</span>
      <span className="text-subtle text-muted-foreground">{label}</span>
    </button>
  );
}
