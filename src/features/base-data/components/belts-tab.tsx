"use client";

import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BeltDot, EmptyState, ErrorBanner, SkeletonRows } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";
import { type BeltAdmin, updateBelt } from "../api-admin";
import { useBeltsAdmin } from "../hooks/use-base-data-admin";
import { BeltDeleteDialog } from "./belt-delete-dialog";
import { BeltFormDialog } from "./belt-form-dialog";

function RowMenu({ belt, onEdit, onDelete }: { belt: BeltAdmin; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${belt.label}`} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onEdit}>ویرایش</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>حذف</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile variant of the belts table above: one divided card instead of a card per row.
function BeltRow({
  belt,
  onToggle,
  onEdit,
  onDelete,
}: {
  belt: BeltAdmin;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <BeltDot code={belt.code} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{belt.label}</span>
          {!belt.isActive ? <Badge variant="secondary">بایگانی</Badge> : null}
        </div>
        <p className="text-subtle mt-0.5 text-muted-foreground tabular-nums">سطح {toPersianDigits(belt.level)}</p>
      </div>
      <Switch checked={belt.isActive} onCheckedChange={onToggle} aria-label={`فعال بودن ${belt.label}`} />
      <RowMenu belt={belt} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function BeltsTab() {
  const { belts, isLoading, error, mutate } = useBeltsAdmin(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BeltAdmin | null>(null);
  const [deleting, setDeleting] = useState<BeltAdmin | null>(null);

  function openEdit(belt: BeltAdmin) {
    setEditing(belt);
    setDialogOpen(true);
  }

  async function toggle(belt: BeltAdmin) {
    try {
      await updateBelt(belt.id, { isActive: !belt.isActive });
      await mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد. دوباره تلاش کنید");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-subtle min-w-0 flex-1 text-muted-foreground">تغییر کمربندها روی مسابقه های منتشر شده اثر ندارد</p>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          کمربند جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card px-4 py-2 shadow-card">
          <SkeletonRows rows={6} />
        </div>
      ) : error ? (
        <ErrorBanner message="دریافت کمربندها انجام نشد" onRetry={() => void mutate()} />
      ) : belts.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <EmptyState title="هنوز کمربندی تعریف نشده است" />
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-subtle text-muted-foreground">کمربند</TableHead>
                  <TableHead className="text-subtle w-24 text-muted-foreground">سطح</TableHead>
                  <TableHead className="text-subtle w-20 text-center text-muted-foreground">فعال</TableHead>
                  <TableHead className="w-14">
                    <span className="sr-only">عملیات</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {belts.map((belt) => (
                  <TableRow key={belt.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <BeltDot code={belt.code} />
                        <span className="text-sm font-medium">{belt.label}</span>
                        {!belt.isActive ? <Badge variant="secondary">بایگانی</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-subtle tabular-nums text-muted-foreground">{toPersianDigits(belt.level)}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={belt.isActive} onCheckedChange={() => void toggle(belt)} aria-label={`فعال بودن ${belt.label}`} />
                    </TableCell>
                    <TableCell>
                      <RowMenu belt={belt} onEdit={() => openEdit(belt)} onDelete={() => setDeleting(belt)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card md:hidden">
            {belts.map((belt) => (
              <BeltRow
                key={belt.id}
                belt={belt}
                onToggle={() => void toggle(belt)}
                onEdit={() => openEdit(belt)}
                onDelete={() => setDeleting(belt)}
              />
            ))}
          </div>
        </>
      )}

      <BeltFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => void mutate()} belt={editing} />
      <BeltDeleteDialog belt={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </div>
  );
}
