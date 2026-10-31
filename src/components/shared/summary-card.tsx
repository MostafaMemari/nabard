import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { IconTile } from "./icon-tile";

export function SummaryCard({
  icon,
  tone = "primary",
  value,
  label,
  href,
  linkLabel,
}: {
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "pending";
  value: string;
  label: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-display font-semibold tabular-nums">{value}</span>
        <span className="text-subtle text-muted-foreground">{label}</span>
        {href && linkLabel ? (
          <Link href={href} className="mt-1 w-fit text-subtle font-medium text-primary underline-offset-4 hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {icon ? <IconTile icon={icon} tone={tone} /> : null}
    </div>
  );
}
