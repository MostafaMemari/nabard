import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

const toneClasses = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  pending: "bg-pending-bg text-pending",
} as const;

export function IconTile({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-tile", toneClasses[tone], className)}>
      <Icon aria-hidden className="size-5" />
    </span>
  );
}
