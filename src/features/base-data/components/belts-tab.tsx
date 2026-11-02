"use client";

import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BeltDot, EmptyState, ErrorBanner, SkeletonRows } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { type BeltAdmin, updateBelt } from "../api-admin";
import { useBeltsAdmin } from "../hooks/use-base-data-admin";
import { BeltDeleteDialog } from "./belt-delete-dialog";
import { BeltFormSheet } from "./belt-form-sheet";

function BeltRow({
  belt,
  onEdit,
  onDelete,
  onToggle,
}: {
  belt: BeltAdmin;
  onEdit: (belt: BeltAdmin) => void;
  onDelete: (belt: BeltAdmin) => void;
  onToggle: (belt: BeltAdmin) => void;
}) {
  return (
    <div className="flex h-13 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <BeltDot code={belt.code} />
        <span className="text-sm font-medium">{belt.label}</span>
        {!belt.isActive ? <Badge variant="secondary">بایگانی</Badge> : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-subtle text-xs text-muted-foreground tabular-nums">سطح {belt.level}</span>
        <Switch checked={belt.isActive} onCheckedChange={() => onToggle(belt)} aria-label={`فعال بودن ${belt.label}`} />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${belt.label}`} />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onEdit(belt)}>ویرایش</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(belt)}>حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function BeltsTab() {
  const { belts, isLoading, error, mutate } = useBeltsAdmin(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BeltAdmin | null>(null);
  const [deleting, setDeleting] = useState<BeltAdmin | null>(null);

  async function toggle(belt: BeltAdmin) {
    try {
      await updateBelt(belt.id, { isActive: !belt.isActive });
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد. دوباره تلاش کنید.");
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">کمربندها</h2>
          <p className="text-subtle mt-0.5 text-muted-foreground">تغییر کمربندها روی مسابقه های منتشر شده اثر ندارد.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          کمربند جدید
        </Button>
      </header>
      <div className="px-4 pb-2">
        {isLoading ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorBanner message="دریافت کمربندها انجام نشد." onRetry={() => void mutate()} />
        ) : belts.length === 0 ? (
          <EmptyState title="هنوز کمربندی تعریف نشده است." />
        ) : (
          belts.map((belt) => (
            <BeltRow
              key={belt.id}
              belt={belt}
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

      <BeltFormSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void mutate()} belt={editing} />
      <BeltDeleteDialog belt={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </section>
  );
}
