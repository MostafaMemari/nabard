import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

const toneClasses = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  pending: "bg-pending-bg text-pending",
} as const;

const sizeClasses = {
  sm: "size-8 rounded-md [&_svg]:size-4",
  md: "size-10 rounded-tile [&_svg]:size-5",
} as const;

export function IconTile({
  icon: Icon,
  tone = "primary",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof toneClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center", sizeClasses[size], toneClasses[tone], className)}>
      <Icon aria-hidden />
    </span>
  );
}
