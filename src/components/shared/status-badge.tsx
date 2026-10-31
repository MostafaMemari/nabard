import { cn } from "cn";

const statusStyles = {
  AWAITING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-warning-bg text-warning" },
  PENDING_REVIEW: { label: "در انتظار بررسی", className: "bg-pending-bg text-pending" },
  APPROVED: { label: "تأیید شده", className: "bg-success-bg text-success" },
  REJECTED: { label: "رد شده", className: "bg-danger-bg text-danger" },
  CANCELED: { label: "لغو شده", className: "bg-pending-bg text-pending" },
  DRAFT: { label: "پیش نویس", className: "bg-pending-bg text-pending" },
  PUBLISHED: { label: "منتشر شده", className: "bg-success-bg text-success" },
} as const;

export type StatusKey = keyof typeof statusStyles;

export function StatusBadge({ status }: { status: StatusKey }) {
  const style = statusStyles[status];

  return <span className={cn("inline-flex h-5 items-center rounded-sm px-2 text-xs font-medium", style.className)}>{style.label}</span>;
}
