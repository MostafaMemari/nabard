"use client";

import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorBanner, MobileCard, SkeletonRows } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { type AgeCategoryAdmin, updateAgeCategory } from "../api-admin";
import { useAgeCategoriesAdmin } from "../hooks/use-base-data-admin";
import { AgeCategoryDeleteDialog } from "./age-category-delete-dialog";
import { AgeCategoryFormSheet } from "./age-category-form-sheet";

function RowMenu({ category, onEdit, onDelete }: { category: AgeCategoryAdmin; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${category.label}`} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onEdit}>ویرایش</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>حذف</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile variant of the age categories table above.
function AgeCategoryCard({
  category,
  onToggle,
  onEdit,
  onDelete,
}: {
  category: AgeCategoryAdmin;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <MobileCard className="gap-0 p-0">
      <div className="flex items-center gap-3 p-4 pb-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.label}</span>
        <Switch checked={category.isActive} onCheckedChange={onToggle} aria-label={`فعال بودن ${category.label}`} />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
        <div className="flex flex-col gap-1 text-subtle text-xs text-muted-foreground tabular-nums">
          <span>
            متولدین {toPersianDigits(category.birthYearStart ?? 0)} تا {toPersianDigits(category.birthYearEnd ?? 0)}
          </span>
          <span>
            {formatJalaliDate(new Date(category.startDate))} تا {formatJalaliDate(new Date(category.endDate))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!category.isActive ? <Badge variant="secondary">بایگانی</Badge> : null}
          <RowMenu category={category} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </MobileCard>
  );
}

export function AgeCategoriesTab() {
  const { ageCategories, isLoading, error, mutate } = useAgeCategoriesAdmin(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AgeCategoryAdmin | null>(null);
  const [deleting, setDeleting] = useState<AgeCategoryAdmin | null>(null);

  function openEdit(category: AgeCategoryAdmin) {
    setEditing(category);
    setSheetOpen(true);
  }

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

      {isLoading ? (
        <div className="px-4 py-2">
          <SkeletonRows rows={5} />
        </div>
      ) : error ? (
        <div className="px-4 py-2">
          <ErrorBanner message="دریافت رده های سنی انجام نشد." onRetry={() => void mutate()} />
        </div>
      ) : ageCategories.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState title="هنوز رده سنی تعریف نشده است." />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-subtle text-muted-foreground">رده سنی</TableHead>
                  <TableHead className="text-subtle w-36 text-muted-foreground">متولدین</TableHead>
                  <TableHead className="text-subtle hidden w-64 sm:table-cell text-muted-foreground">بازه تولد</TableHead>
                  <TableHead className="text-subtle w-20 text-center text-muted-foreground">فعال</TableHead>
                  <TableHead className="w-14">
                    <span className="sr-only">عملیات</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ageCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{category.label}</span>
                        {!category.isActive ? <Badge variant="secondary">بایگانی</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-subtle tabular-nums text-muted-foreground">
                      {toPersianDigits(category.birthYearStart ?? 0)} تا {toPersianDigits(category.birthYearEnd ?? 0)}
                    </TableCell>
                    <TableCell className="text-subtle hidden tabular-nums sm:table-cell text-muted-foreground">
                      {formatJalaliDate(new Date(category.startDate))} تا {formatJalaliDate(new Date(category.endDate))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={() => void toggle(category)}
                        aria-label={`فعال بودن ${category.label}`}
                      />
                    </TableCell>
                    <TableCell>
                      <RowMenu category={category} onEdit={() => openEdit(category)} onDelete={() => setDeleting(category)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {ageCategories.map((category) => (
              <AgeCategoryCard
                key={category.id}
                category={category}
                onToggle={() => void toggle(category)}
                onEdit={() => openEdit(category)}
                onDelete={() => setDeleting(category)}
              />
            ))}
          </div>
        </>
      )}

      <AgeCategoryFormSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void mutate()} category={editing} />
      <AgeCategoryDeleteDialog category={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </section>
  );
}
