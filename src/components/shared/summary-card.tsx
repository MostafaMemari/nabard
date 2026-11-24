import { cn } from "cn";
import { ChevronLeftIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { IconTile } from "./icon-tile";

type StatTone = "primary" | "warning";

// Compact stat tile for dashboard overviews: icon chip, large tabular number,
// one-line label. The whole tile is the link when a destination exists.
// Pending queues carry the warning tone; an empty queue goes quiet (grey chip,
// muted number) so live counts stand out from zeros.
export function SummaryCard({
  value,
  label,
  href,
  icon,
  tone = "primary",
}: {
  value: number;
  label: string;
  href?: string;
  icon?: LucideIcon;
  tone?: StatTone;
}) {
  const live = value > 0;

  const content = (
    <>
      {icon ? (
        <span className="flex items-center justify-between">
          <IconTile icon={icon} tone={live ? tone : "pending"} size="sm" />
          {href ? <ChevronLeftIcon aria-hidden className="size-4 shrink-0 self-center text-muted-foreground/70" /> : null}
        </span>
      ) : null}
      <span className={cn("text-display font-semibold tabular-nums", !live && "text-muted-foreground")}>{formatNumber(value)}</span>
      <span className="text-subtle truncate text-muted-foreground" title={label}>
        {label}
      </span>
    </>
  );

  const shell = cn(
    "flex flex-col gap-1 rounded-xl border border-border bg-card p-3.5 shadow-card md:p-5",
    href &&
      "min-h-11 border-border bg-card transition-colors duration-150 hover:border-primary/40 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring/60",
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label}: ${formatNumber(value)}`} className={shell}>
        {content}
      </Link>
    );
  }
  return <div className={shell}>{content}</div>;
}
