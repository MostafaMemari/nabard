"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { BeltChip, ErrorBanner, PageHeader, SkeletonRows } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { useAgeCategories, useBelts, useWeightClasses } from "../hooks/use-base-data";
import { ageCategoryLabels, genderLabels } from "../labels";
import type { AgeCategory } from "../types";
import { AgeCategoryDatesDialog } from "./age-category-dates-dialog";

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-subtle mt-0.5 text-muted-foreground">{description}</p>
      </header>
      <div className="px-4 pb-2">{children}</div>
    </section>
  );
}

function AgeCategoryRow({ category, onEdit }: { category: AgeCategory; onEdit: (category: AgeCategory) => void }) {
  return (
    <div className="flex h-13 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{ageCategoryLabels[category.name]}</span>
        <span className="text-subtle text-xs text-muted-foreground tabular-nums">
          از {formatJalaliDate(new Date(category.startDate))} تا {formatJalaliDate(new Date(category.endDate))}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
        <PencilIcon data-icon="inline-start" />
        ویرایش تاریخ ها
      </Button>
    </div>
  );
}

export function BaseDataAdminScreen() {
  const { ageCategories, isLoading: categoriesLoading, error: categoriesError, mutate: retryCategories } = useAgeCategories();
  const { belts, isLoading: beltsLoading, error: beltsError, mutate: retryBelts } = useBelts();
  const { weightClasses, isLoading: weightsLoading, error: weightsError, mutate: retryWeights } = useWeightClasses();
  const [editing, setEditing] = useState<AgeCategory | null>(null);

  const weightCategoryName = new Map(ageCategories.map((category) => [category.id, ageCategoryLabels[category.name]]));

  return (
    <>
      <PageHeader title="اطلاعات پایه" description="رده های سنی، کمربندها و رده های وزنی؛ فقط بازه تاریخ رده های سنی قابل ویرایش است." />

      <SectionCard title="رده های سنی" description="بازه تاریخ هر رده سنی؛ تغییر آن روی واجد شرایط بودن هنرجوها اثر می گذارد.">
        {categoriesLoading ? (
          <SkeletonRows rows={4} />
        ) : categoriesError ? (
          <ErrorBanner message="دریافت رده های سنی انجام نشد." onRetry={() => retryCategories()} />
        ) : (
          ageCategories.map((category) => <AgeCategoryRow key={category.id} category={category} onEdit={(row) => setEditing(row)} />)
        )}
      </SectionCard>

      <SectionCard title="کمربندها" description="فقط قابل مشاهده است.">
        {beltsLoading ? (
          <SkeletonRows rows={4} />
        ) : beltsError ? (
          <ErrorBanner message="دریافت کمربندها انجام نشد." onRetry={() => retryBelts()} />
        ) : (
          <div className="flex flex-wrap items-center gap-2 py-3">
            {belts.map((belt) => (
              <BeltChip key={belt.id} belt={belt} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="رده های وزنی" description="فقط قابل مشاهده است.">
        {weightsLoading ? (
          <SkeletonRows rows={4} />
        ) : weightsError ? (
          <ErrorBanner message="دریافت رده های وزنی انجام نشد." onRetry={() => retryWeights()} />
        ) : (
          weightClasses.map((weightClass) => (
            <div key={weightClass.id} className="flex h-12 items-center justify-between gap-3 border-b border-border last:border-b-0">
              <span className="text-sm">
                {weightCategoryName.get(weightClass.ageCategoryId) ?? "—"} · {genderLabels[weightClass.gender]}
              </span>
              <span className="text-subtle text-sm text-muted-foreground tabular-nums">
                {weightClass.label} ({toPersianDigits(weightClass.minWeightKg)}
                {weightClass.maxWeightKg === null ? " به بالا" : ` تا ${toPersianDigits(weightClass.maxWeightKg)}`} کیلوگرم)
              </span>
            </div>
          ))
        )}
      </SectionCard>

      <AgeCategoryDatesDialog category={editing} onDone={() => void retryCategories()} onClose={() => setEditing(null)} />
    </>
  );
}
