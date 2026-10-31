import { cn } from "cn";
import { formatJalaliDate, formatNumber } from "@/lib/format";

const DAY_MS = 86_400_000;

function chipClass(days: number): string {
  if (days < 0) {
    return "bg-danger-bg text-danger";
  }
  if (days <= 3) {
    return "bg-warning-bg text-warning";
  }
  return "bg-pending-bg text-pending";
}

function chipLabel(deadline: string, days: number): string {
  if (days < 0) {
    return "مهلت تمام شده";
  }
  if (days === 0) {
    return "امروز آخرین مهلت است";
  }
  if (days <= 3) {
    return `${formatNumber(days)} روز مانده`;
  }
  return formatJalaliDate(new Date(deadline));
}

export function DeadlineChip({ deadline, now = new Date(), className }: { deadline: string; now?: Date; className?: string }) {
  const days = Math.ceil((new Date(deadline).getTime() - now.getTime()) / DAY_MS);

  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center rounded-full px-2.5 text-subtle font-medium whitespace-nowrap",
        chipClass(days),
        className,
      )}
    >
      {chipLabel(deadline, days)}
    </span>
  );
}
