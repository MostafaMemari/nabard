"use client";

import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorBanner, SkeletonRows } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { type AgeCategoryAdmin, updateAgeCategory } from "../api-admin";
import { useAgeCategoriesAdmin } from "../hooks/use-base-data-admin";
import { AgeCategoryDeleteDialog } from "./age-category-delete-dialog";
import { AgeCategoryFormSheet } from "./age-category-form-sheet";

function AgeCategoryRow({
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: AgeCategoryAdmin;
  onEdit: (category: AgeCategoryAdmin) => void;
  onDelete: (category: AgeCategoryAdmin) => void;
  onToggle: (category: AgeCategoryAdmin) => void;
}) {
  return (
    <div className="flex min-h-13 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{category.label}</span>
          {!category.isActive ? <Badge variant="secondary">بایگانی</Badge> : null}
        </div>
        <span className="text-subtle text-muted-foreground tabular-nums">
          متولدین {toPersianDigits(category.birthYearStart ?? 0)} تا {toPersianDigits(category.birthYearEnd ?? 0)} ·{" "}
          {formatJalaliDate(new Date(category.startDate))} تا {formatJalaliDate(new Date(category.endDate))}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={category.isActive} onCheckedChange={() => onToggle(category)} aria-label={`فعال بودن ${category.label}`} />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${category.label}`} />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onEdit(category)}>ویرایش</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(category)}>حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AgeCategoriesTab() {
  const { ageCategories, isLoading, error, mutate } = useAgeCategoriesAdmin(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AgeCategoryAdmin | null>(null);
  const [deleting, setDeleting] = useState<AgeCategoryAdmin | null>(null);

  async function toggle(category: AgeCategoryAdmin) {
    try {
      await updateAgeCategory(category.id, { isActive: !category.isActive });
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">رده های سنی</h2>
          <p className="text-subtle mt-0.5 text-muted-foreground">بازه های رده های فعال نباید همپوشانی داشته باشند.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          رده سنی جدید
        </Button>
      </header>
      <div className="px-4 pb-2">
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : error ? (
          <ErrorBanner message="دریافت رده های سنی انجام نشد." onRetry={() => void mutate()} />
        ) : ageCategories.length === 0 ? (
          <EmptyState title="هنوز رده سنی تعریف نشده است." />
        ) : (
          ageCategories.map((category) => (
            <AgeCategoryRow
              key={category.id}
              category={category}
              onEdit={(row) => {
                setEditing(row);
                setSheetOpen(true);
              }}
              onDelete={setDeleting}
              onToggle={(row) => void toggle(row)}
            />
          ))
        )}
      </div>

      <AgeCategoryFormSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void mutate()} category={editing} />
      <AgeCategoryDeleteDialog category={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </section>
  );
}
