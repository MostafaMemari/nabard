"use client";

import { MapPinnedIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorBanner, PageHeader, SkeletonRows, StateCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/format";
import { useCounties } from "../hooks/use-counties";
import type { County } from "../types";
import { CountyDeleteDialog } from "./county-delete-dialog";
import { CountyFormDialog } from "./county-form-dialog";
import { CountyRow } from "./county-row";

export function CountiesAdminScreen() {
  const { counties, isLoading, error, mutate } = useCounties();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<County | null>(null);
  const [deleting, setDeleting] = useState<County | null>(null);

  return (
    <>
      <PageHeader
        title="شهرستان ها"
        description="شهرستان های استان شما؛ مربیان و مسابقات شهرستانی از این فهرست استفاده می کنند."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            شهرستان جدید
          </Button>
        }
      />

      {isLoading ? (
        <StateCard className="p-4">
          <SkeletonRows rows={6} />
        </StateCard>
      ) : error ? (
        <ErrorBanner message="دریافت شهرستان ها انجام نشد." onRetry={() => mutate()} />
      ) : counties.length === 0 ? (
        <StateCard>
          <EmptyState
            icon={MapPinnedIcon}
            title="هنوز شهرستانی ثبت نشده است."
            description="شهرستان های پیش فرض همه استان ها با مهاجرت پایگاه داده ثبت شده اند؛ با مدیر استان تماس بگیرید."
          />
        </StateCard>
      ) : (
        <StateCard>
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">شهرستان های استان</h2>
            <span className="text-subtle text-muted-foreground">{toPersianDigits(counties.length)} شهرستان</span>
          </header>
          <div className="px-4 pb-2">
            {counties.map((county) => (
              <CountyRow key={county.id} county={county} onEdit={(row) => setEditing(row)} onDelete={(row) => setDeleting(row)} />
            ))}
          </div>
        </StateCard>
      )}

      <CountyFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => void mutate()} county={null} />
      <CountyFormDialog
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        onSaved={() => void mutate()}
        county={editing}
      />
      <CountyDeleteDialog county={deleting} onDone={() => void mutate()} onClose={() => setDeleting(null)} />
    </>
  );
}
