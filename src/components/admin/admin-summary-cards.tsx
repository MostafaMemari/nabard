"use client";

import { SummaryCard } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

type Summary = {
  pendingPaymentsCount: number;
  pendingProfilesCount: number;
  pendingRefundsCount: number;
  pendingCountyChangesCount: number;
  pendingTransfersCount: number;
  openCompetitionsCount: number;
  weeklyRegistrationsCount: number;
};

const cards: { key: keyof Summary; label: string; href?: string; linkLabel?: string }[] = [
  { key: "pendingPaymentsCount", label: "رسیدهای در انتظار بررسی", href: "/admin/payments?status=pending", linkLabel: "مشاهده پرداخت ها" },
  { key: "pendingProfilesCount", label: "پروفایل های در انتظار تأیید", href: "/admin/profiles", linkLabel: "بررسی پروفایل ها" },
  { key: "pendingRefundsCount", label: "بازپرداخت های در انتظار", href: "/admin/refunds?status=pending", linkLabel: "مشاهده بازپرداخت ها" },
  {
    key: "pendingCountyChangesCount",
    label: "درخواست های تغییر شهرستان",
    href: "/admin/county-changes?status=pending",
    linkLabel: "بررسی درخواست ها",
  },
  {
    key: "pendingTransfersCount",
    label: "درخواست های انتقال هنرجو",
    href: "/admin/transfer-requests?status=pending",
    linkLabel: "بررسی انتقال ها",
  },
  { key: "openCompetitionsCount", label: "مسابقات باز", href: "/admin/competitions", linkLabel: "مشاهده مسابقات" },
  { key: "weeklyRegistrationsCount", label: "ثبت نام های این هفته" },
];

export function AdminSummaryCards({ summary, isLoading }: { summary: Summary | null; isLoading: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading || !summary
        ? [1, 2, 3, 4, 5, 6].map((key) => <Skeleton key={key} className="h-32 w-full" />)
        : cards.map((card) => (
            <SummaryCard
              key={card.key}
              value={formatNumber(summary[card.key])}
              label={card.label}
              href={card.href}
              linkLabel={card.linkLabel}
            />
          ))}
    </div>
  );
}
