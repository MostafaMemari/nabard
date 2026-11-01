import { cn } from "cn";

const statusStyles = {
  AWAITING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-warning-bg text-warning" },
  PENDING_REVIEW: { label: "در انتظار بررسی", className: "bg-pending-bg text-pending" },
  APPROVED: { label: "تأیید شده", className: "bg-success-bg text-success" },
  REJECTED: { label: "رد شده", className: "bg-danger-bg text-danger" },
  CANCELED: { label: "لغو شده", className: "bg-pending-bg text-pending" },
  DRAFT: { label: "پیش نویس", className: "bg-pending-bg text-pending" },
  PUBLISHED: { label: "منتشر شده", className: "bg-success-bg text-success" },
  ACTIVE: { label: "فعال", className: "bg-success-bg text-success" },
  INACTIVE: { label: "غیرفعال", className: "bg-pending-bg text-pending" },
  REFUND_PENDING: { label: "در انتظار بازپرداخت", className: "bg-warning-bg text-warning" },
  REFUND_COMPLETED: { label: "بازپرداخت شده", className: "bg-success-bg text-success" },
} as const;

export type StatusKey = keyof typeof statusStyles;

export function StatusBadge({ status }: { status: StatusKey }) {
  const style = statusStyles[status];

  return (
    <span className={cn("inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-subtle font-medium", style.className)}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
