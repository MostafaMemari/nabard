"use client";

import { ArrowLeftRightIcon, CalendarPlusIcon, ReceiptTextIcon, TrophyIcon, Undo2Icon, UserCheckIcon, UsersIcon } from "lucide-react";
import { SummaryCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

type Summary = {
  pendingPaymentsCount: number;
  pendingProfilesCount: number;
  pendingRefundsCount: number;
  pendingCountyChangesCount: number;
  pendingTransfersCount: number;
  openCompetitionsCount: number;
  weeklyRegistrationsCount: number;
};

const cards: { key: keyof Summary; label: string; href?: string; icon: typeof TrophyIcon; tone: "primary" | "warning" }[] = [
  {
    key: "pendingPaymentsCount",
    label: "رسید در انتظار بررسی",
    href: "/admin/payments?status=pending",
    icon: ReceiptTextIcon,
    tone: "warning",
  },
  { key: "pendingProfilesCount", label: "پروفایل در انتظار تأیید", href: "/admin/profiles", icon: UserCheckIcon, tone: "warning" },
  { key: "pendingRefundsCount", label: "بازپرداخت در انتظار", href: "/admin/refunds?status=pending", icon: Undo2Icon, tone: "warning" },
  {
    key: "pendingCountyChangesCount",
    label: "درخواست تغییر شهرستان",
    href: "/admin/county-changes?status=pending",
    icon: ArrowLeftRightIcon,
    tone: "warning",
  },
  {
    key: "pendingTransfersCount",
    label: "درخواست انتقال هنرجو",
    href: "/admin/transfer-requests?status=pending",
    icon: UsersIcon,
    tone: "warning",
  },
  { key: "openCompetitionsCount", label: "مسابقات باز", href: "/admin/competitions", icon: TrophyIcon, tone: "primary" },
  { key: "weeklyRegistrationsCount", label: "ثبت نام این هفته", icon: CalendarPlusIcon, tone: "primary" },
];

export function AdminSummaryCards({ summary, isLoading }: { summary: Summary | null; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {isLoading || !summary
        ? [1, 2, 3, 4].map((key) => <Skeleton key={key} className="h-28 w-full" />)
        : cards.map((card) => (
            <SummaryCard key={card.key} value={summary[card.key]} label={card.label} href={card.href} icon={card.icon} tone={card.tone} />
          ))}
    </div>
  );
}
