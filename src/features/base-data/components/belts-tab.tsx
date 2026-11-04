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
import { BeltFormSheet } from "./belt-form-sheet";

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

      {isLoading ? (
        <div className="px-4 py-2">
          <SkeletonRows rows={6} />
        </div>
      ) : error ? (
        <div className="px-4 py-2">
          <ErrorBanner message="دریافت کمربندها انجام نشد." onRetry={() => void mutate()} />
        </div>
      ) : belts.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState title="هنوز کمربندی تعریف نشده است." />
        </div>
      ) : (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${belt.label}`} />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(belt);
                          setSheetOpen(true);
                        }}
                      >
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleting(belt)}>حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <BeltFormSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void mutate()} belt={editing} />
      <BeltDeleteDialog belt={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </section>
  );
}
