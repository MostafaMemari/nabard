"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileCard, MobileCardFooter, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { RegistrationRequestPhotoDialog } from "@/features/students/components/registration-request-photo-dialog";
import { formatJalaliDate } from "@/lib/format";
import { kindIcons, kindLabels, type RequestListRow, statusKeyOf } from "./request-rows";

export function RowActions({ row, onChanged }: { row: RequestListRow; onChanged: () => Promise<unknown> }) {
  const [photoOpen, setPhotoOpen] = useState(false);

  if (row.kind !== "registration" || row.status === "APPROVED") return <span className="text-subtle text-muted-foreground">—</span>;

  return (
    <span className="flex items-center gap-2">
      {photoOpen ? (
        <RegistrationRequestPhotoDialog
          request={{ id: row.id, fullName: row.title }}
          open={photoOpen}
          onOpenChange={setPhotoOpen}
          onUploaded={onChanged}
        />
      ) : null}
      <Button size="sm" variant="outline" className="h-11 md:h-8" render={<Link href={`/coach/requests/${row.id}/edit`} />}>
        ویرایش
      </Button>
      <Button size="sm" variant="outline" className="h-11 md:h-8" onClick={() => setPhotoOpen(true)}>
        عکس
      </Button>
    </span>
  );
}

export function RequestCell({ row }: { row: RequestListRow }) {
  const Icon = kindIcons[row.kind];

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{row.title}</span>
        {row.subtitle ? <span className="text-subtle truncate text-muted-foreground">{row.subtitle}</span> : null}
        {row.status === "REJECTED" && row.note ? <span className="text-subtle truncate text-warning">دلیل رد: {row.note}</span> : null}
        {row.photoMissing ? <span className="text-subtle truncate text-warning">عکس پرسنلی بارگذاری نشده است</span> : null}
      </div>
    </div>
  );
}

export function RequestCard({ row, onChanged }: { row: RequestListRow; onChanged: () => Promise<unknown> }) {
  const Icon = kindIcons[row.kind];

  return (
    <MobileCard>
      <div className="flex items-center gap-3">
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.title}</span>
        <StatusBadge status={statusKeyOf(row.kind, row.status)} />
      </div>
      {row.subtitle ? <p className="text-subtle truncate text-muted-foreground">{row.subtitle}</p> : null}
      {row.status === "REJECTED" && row.note ? <p className="text-subtle text-warning">دلیل رد: {row.note}</p> : null}
      {row.photoMissing ? <p className="text-subtle text-warning">عکس پرسنلی بارگذاری نشده است</p> : null}
      <MobileCardFooter>
        <span className="text-subtle text-muted-foreground">
          {kindLabels[row.kind]}
          {row.createdAt ? ` — ${formatJalaliDate(new Date(row.createdAt))}` : ""}
        </span>
        <RowActions row={row} onChanged={onChanged} />
      </MobileCardFooter>
    </MobileCard>
  );
}
