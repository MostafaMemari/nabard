import { cn } from "cn";
import type { Belt } from "@/features/base-data";
import { toPersianDigits } from "@/lib/format";

const colorBeltLabels: Partial<Record<Belt["name"], string>> = {
  WHITE: "سفید",
  YELLOW: "زرد",
  GREEN: "سبز",
  BLUE: "آبی",
  RED: "قرمز",
};

const colorBeltDots: Partial<Record<Belt["name"], string>> = {
  WHITE: "bg-belt-white border border-border",
  YELLOW: "bg-belt-yellow",
  GREEN: "bg-belt-green",
  BLUE: "bg-belt-blue",
  RED: "bg-belt-red",
};

function dotClass(name: Belt["name"]): string {
  const colorDot = colorBeltDots[name];
  if (colorDot) {
    return colorDot;
  }
  return name.startsWith("POOM") ? "bg-belt-poom" : "bg-belt-dan";
}

export function beltLabel(name: Belt["name"]): string {
  const colorLabel = colorBeltLabels[name];
  if (colorLabel) {
    return colorLabel;
  }
  const [rank, level] = name.split("_");
  const rankLabel = rank === "POOM" ? "پوم" : "دان";
  return `${rankLabel} ${toPersianDigits(Number(level))}`;
}

export function BeltDot({ name }: { name: Belt["name"] }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dotClass(name))} />;
}

export function BeltChip({ belt, className }: { belt: Belt; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-subtle font-medium whitespace-nowrap",
        className,
      )}
    >
      <BeltDot name={belt.name} />
      {beltLabel(belt.name)}
    </span>
  );
}
