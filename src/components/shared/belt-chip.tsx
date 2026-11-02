import { cn } from "cn";
import type { Belt } from "@/features/base-data";

const colorBeltDots: Record<string, string> = {
  white: "bg-belt-white border border-border",
  yellow: "bg-belt-yellow",
  green: "bg-belt-green",
  blue: "bg-belt-blue",
  red: "bg-belt-red",
};

function dotClass(code: string): string {
  const colorDot = colorBeltDots[code];
  if (colorDot) {
    return colorDot;
  }
  return code.startsWith("poom") ? "bg-belt-poom" : "bg-belt-dan";
}

export function BeltDot({ code }: { code: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dotClass(code))} />;
}

export function BeltChip({ belt, className }: { belt: Belt; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-subtle font-medium whitespace-nowrap",
        className,
      )}
    >
      <BeltDot code={belt.code} />
      {belt.label}
    </span>
  );
}
