"use client";

import { MapPinnedIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorBanner, PageHeader, SkeletonRows } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toPersianDigits } from "@/lib/format";
import { useCounties } from "../hooks/use-counties";
import type { County } from "../types";
import { CountyDeleteDialog } from "./county-delete-dialog";
import { CountyFormSheet } from "./county-form-sheet";

function CountyRow({ county, onEdit, onDelete }: { county: County; onEdit: (county: County) => void; onDelete: (county: County) => void }) {
  return (
    <div className="flex h-13 items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-sm">{county.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`عملیات ${county.name}`} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onEdit(county)}>ویرایش</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(county)}>حذف</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CountiesAdminScreen() {
  const { counties, isLoading, error, mutate } = useCounties();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<County | null>(null);
  const [deleting, setDeleting] = useState<County | null>(null);

  return (
    <>
      <PageHeader
        title="شهرستان ها"
        description="شهرستان های استان شما؛ مربیان و مسابقات شهرستانی از این فهرست استفاده می کنند."
        action={
          <Button onClick={() => setSheetOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            شهرستان جدید
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRows rows={6} />
      ) : error ? (
        <ErrorBanner message="دریافت شهرستان ها انجام نشد." onRetry={() => mutate()} />
      ) : counties.length === 0 ? (
        <EmptyState
          icon={MapPinnedIcon}
          title="هنوز شهرستانی ثبت نشده است."
          description="شهرستان های پیش فرض همه استان ها با مهاجرت پایگاه داده ثبت شده اند؛ با مدیر استان تماس بگیرید."
          action={
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              شهرستان جدید
            </Button>
          }
        />
      ) : (
        <section className="rounded-xl border border-border bg-card shadow-card">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">شهرستان های استان</h2>
            <span className="text-subtle text-muted-foreground">{toPersianDigits(counties.length)} شهرستان</span>
          </header>
          <div className="px-4 pb-2">
            {counties.map((county) => (
              <CountyRow key={county.id} county={county} onEdit={(row) => setEditing(row)} onDelete={(row) => setDeleting(row)} />
            ))}
          </div>
        </section>
      )}

      <CountyFormSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => void mutate()} county={null} />
      <CountyFormSheet
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        onSaved={() => void mutate()}
        county={editing}
      />
      <CountyDeleteDialog county={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </>
  );
}
