"use client";

import { ChartPieIcon, ClipboardListIcon, MapPinnedIcon, TrendingUpIcon, TrophyIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { DownloadMenu, ErrorBanner, IconTile, PageHeader, SectionCard } from "@/components/shared";
import { ProvinceFilter } from "@/features/super/components/province-filter";
import { formatNumber, toPersianDigits } from "@/lib/format";
import { buildApiUrl } from "@/lib/http";
import { provinceLabels } from "@/lib/provinces";
import { useSearchParam } from "@/lib/use-search-param";
import { useSuperAnalytics } from "../hooks/use-super-analytics";
import type { SuperAnalytics } from "../types";
import { BarList } from "./charts/bar-list";
import { DonutChart } from "./charts/donut-chart";
import { TrendChart } from "./charts/trend-chart";

function KpiCard({ icon, label, value }: { icon: typeof UsersIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <IconTile icon={icon} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-display text-lg font-semibold tabular-nums">{toPersianDigits(formatNumber(value))}</span>
        <span className="text-subtle text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-3" />
        <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-2" />
      </div>
    </div>
  );
}

function Dashboard({ analytics }: { analytics: SuperAnalytics }) {
  const { kpis, profiles, trend, counties, hiddenCounties } = analytics;
  const profileTotal = profiles.approved + profiles.pending + profiles.rejected;
  const approvalRate = profileTotal === 0 ? 0 : Math.round((profiles.approved / profileTotal) * 100);
  const trendTotal = trend.reduce((sum, point) => sum + point.count, 0);
  const trendRange = `${trend[0].label} ${toPersianDigits(trend[0].year)} تا ${trend[trend.length - 1].label} ${toPersianDigits(trend[trend.length - 1].year)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={ClipboardListIcon} label="ثبت‌نام‌ها" value={kpis.registrations} />
        <KpiCard icon={UsersIcon} label="هنرجویان" value={kpis.students} />
        <KpiCard icon={UserRoundIcon} label="مربیان" value={kpis.coaches} />
        <KpiCard icon={TrophyIcon} label="مسابقات" value={kpis.competitions} />
      </div>

      <SectionCard
        title="روند ثبت‌نام‌ها"
        description={trendRange}
        icon={TrendingUpIcon}
        action={
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-sm font-medium tabular-nums text-primary">
            مجموع: {toPersianDigits(formatNumber(trendTotal))}
          </span>
        }
      >
        <TrendChart points={trend} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard title="مقایسه شهرستان‌ها" description="بر اساس تعداد ثبت‌نام" icon={MapPinnedIcon} className="lg:col-span-3">
          <BarList
            items={counties.map((county) => ({
              id: county.id,
              label: county.name,
              sublabel:
                analytics.province === null
                  ? `${provinceLabels[county.province]} • ${toPersianDigits(county.students)} هنرجو`
                  : `${toPersianDigits(county.students)} هنرجو`,
              value: county.registrations,
            }))}
            emptyMessage="هنوز ثبت‌نامی برای مقایسه وجود ندارد."
          />
          {hiddenCounties > 0 ? (
            <p className="text-subtle text-sm text-muted-foreground">و {toPersianDigits(hiddenCounties)} شهرستان دیگر…</p>
          ) : null}
        </SectionCard>

        <SectionCard title="نرخ تأیید پروفایل‌ها" description="وضعیت پروفایل هنرجویان" icon={ChartPieIcon} className="lg:col-span-2">
          <DonutChart
            centerValue={`${toPersianDigits(approvalRate)}٪`}
            centerLabel="تأیید شده"
            slices={[
              { id: "approved", label: "تأیید شده", value: profiles.approved, className: "stroke-success", dotClassName: "bg-success" },
              { id: "pending", label: "در انتظار بررسی", value: profiles.pending, className: "stroke-pending", dotClassName: "bg-pending" },
              { id: "rejected", label: "رد شده", value: profiles.rejected, className: "stroke-danger", dotClassName: "bg-danger" },
            ]}
          />
          <p className="text-subtle text-sm text-muted-foreground">
            {toPersianDigits(formatNumber(profiles.approved))} پروفایل تأیید شده از مجموع {toPersianDigits(formatNumber(profileTotal))}{" "}
            پروفایل.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

export function SuperAnalyticsScreen() {
  const [provinceParam] = useSearchParam("province");
  const province = provinceParam === "" ? null : provinceParam;
  const { analytics, isLoading, error, mutate } = useSuperAnalytics(province);
  const provinceQuery = province === null ? "" : `?province=${encodeURIComponent(province)}`;

  return (
    <>
      <PageHeader
        title="داشبورد آماری"
        description="نمای کلان آمار سامانه در سطح استان ها."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DownloadMenu
              items={[
                { label: "فایل اکسل (xlsx)", href: buildApiUrl(`/api/v1/super/analytics.xlsx${provinceQuery}`) },
                { label: "فایل PDF", href: buildApiUrl(`/api/v1/super/analytics.pdf${provinceQuery}`) },
              ]}
            />
            <ProvinceFilter />
          </div>
        }
      />
      {error ? <ErrorBanner onRetry={() => mutate()} /> : null}
      {analytics ? <Dashboard analytics={analytics} /> : isLoading ? <DashboardSkeleton /> : null}
    </>
  );
}
