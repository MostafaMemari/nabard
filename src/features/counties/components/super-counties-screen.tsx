"use client";

import { MapPinnedIcon } from "lucide-react";
import { EmptyState, ErrorBanner, PageHeader, SkeletonRows } from "@/components/shared";
import { toPersianDigits } from "@/lib/format";
import { provinceLabels, provinceValues } from "@/lib/provinces";
import { useSearchParam } from "@/lib/use-search-param";
import { useCounties } from "../hooks/use-counties";

export function SuperCountiesScreen() {
  const [province] = useSearchParam("province");
  const { counties, isLoading, error, mutate } = useCounties({ province: province === "" ? undefined : province });

  const groups = provinceValues
    .map((item) => ({ province: item, counties: counties.filter((county) => county.province === item) }))
    .filter((group) => group.counties.length > 0);

  return (
    <>
      <PageHeader title="شهرستان ها" description="شهرستان های همه استان ها؛ فقط قابل مشاهده است." />

      {isLoading ? (
        <SkeletonRows rows={6} />
      ) : error ? (
        <ErrorBanner message="دریافت شهرستان ها انجام نشد." onRetry={() => mutate()} />
      ) : groups.length === 0 ? (
        <EmptyState icon={MapPinnedIcon} title="شهرستانی یافت نشد." />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.province} className="rounded-xl border border-border bg-card shadow-card">
              <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">{provinceLabels[group.province]}</h2>
                <span className="text-subtle text-muted-foreground">{toPersianDigits(group.counties.length)} شهرستان</span>
              </header>
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {group.counties.map((county) => (
                  <span key={county.id} className="rounded-full bg-muted px-2.5 py-1 text-subtle">
                    {county.name}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
