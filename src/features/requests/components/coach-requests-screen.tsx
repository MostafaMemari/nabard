"use client";

import { cn } from "cn";
import { ArrowLeftRightIcon, ImageUpIcon, InboxIcon, MapPinnedIcon, PlusIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DataTable, type DataTableColumn, type FilterTab, ListToolbar, PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import { photoChangeStatusKey, usePhotoChangeRequests } from "@/features/photo-changes";
import { provinceChangeStatusKey, useProvinceChangeRequests } from "@/features/province-changes";
import { NewRequestDialog } from "@/features/requests/components/new-request-dialog";
import { RegistrationRequestPhotoDialog } from "@/features/students/components/registration-request-photo-dialog";
import { useRegistrationRequests } from "@/features/students/hooks/use-registration-requests";
import { type RegistrationStatus, registrationStatusKey } from "@/features/students/types";
import { transferStatusKey, useTransferRequests } from "@/features/transfers";
import { formatJalaliDate, formatNumber } from "@/lib/format";

type RequestKind = "registration" | "transfer" | "photo" | "province";
type RequestTypeFilter = "all" | RequestKind;
type RequestStatusFilter = "all" | RegistrationStatus;

const typeTabs: FilterTab[] = [
  { id: "all", label: "همه" },
  { id: "registration", label: "ثبت هنرجو" },
  { id: "transfer", label: "انتقال هنرجو" },
  { id: "photo", label: "تغییر عکس" },
  { id: "province", label: "تغییر استان" },
];

const kindLabels: Record<RequestKind, string> = {
  registration: "ثبت هنرجو",
  transfer: "انتقال هنرجو",
  photo: "تغییر عکس",
  province: "تغییر استان",
};

const kindIcons: Record<RequestKind, typeof UserPlusIcon> = {
  registration: UserPlusIcon,
  transfer: ArrowLeftRightIcon,
  photo: ImageUpIcon,
  province: MapPinnedIcon,
};

const statusCards: Array<{ id: Exclude<RequestStatusFilter, "all">; label: string }> = [
  { id: "PENDING", label: "در انتظار تأیید" },
  { id: "APPROVED", label: "تأیید شده" },
  { id: "REJECTED", label: "رد شده" },
];

// One row per request across the four kinds, so the coach sees everything in
// a single list instead of four separate cards.
type RequestListRow = {
  key: string;
  kind: RequestKind;
  id: string;
  title: string;
  subtitle: string | null;
  note: string | null;
  photoMissing: boolean;
  createdAt: string | null;
  status: RegistrationStatus;
};

function statusKeyOf(kind: RequestKind, status: RegistrationStatus) {
  switch (kind) {
    case "registration":
      return registrationStatusKey(status);
    case "transfer":
      return transferStatusKey(status);
    case "photo":
      return photoChangeStatusKey(status);
    case "province":
      return provinceChangeStatusKey(status);
  }
}

function RowActions({ row, onChanged }: { row: RequestListRow; onChanged: () => Promise<unknown> }) {
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
      <Button size="sm" variant="outline" render={<Link href={`/coach/requests/${row.id}/edit`} />}>
        ویرایش
      </Button>
      <Button size="sm" variant="outline" onClick={() => setPhotoOpen(true)}>
        عکس
      </Button>
    </span>
  );
}

function RequestCell({ row }: { row: RequestListRow }) {
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

function RequestCard({ row, onChanged }: { row: RequestListRow; onChanged: () => Promise<unknown> }) {
  const Icon = kindIcons[row.kind];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.title}</span>
        <StatusBadge status={statusKeyOf(row.kind, row.status)} />
      </div>
      {row.subtitle ? <p className="text-subtle mt-1.5 truncate text-muted-foreground">{row.subtitle}</p> : null}
      {row.status === "REJECTED" && row.note ? <p className="text-subtle mt-1 text-warning">دلیل رد: {row.note}</p> : null}
      {row.photoMissing ? <p className="text-subtle mt-1 text-warning">عکس پرسنلی بارگذاری نشده است</p> : null}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-subtle text-muted-foreground">
          {kindLabels[row.kind]}
          {row.createdAt ? ` — ${formatJalaliDate(new Date(row.createdAt))}` : ""}
        </span>
        <RowActions row={row} onChanged={onChanged} />
      </div>
    </div>
  );
}

function StatusCard({ value, label, active, onClick }: { value: number; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border bg-card p-4 text-start shadow-card transition-colors md:p-6",
        active ? "border-primary" : "border-border hover:border-primary/60",
      )}
    >
      <span className="text-display font-semibold tabular-nums">{formatNumber(value)}</span>
      <span className="text-subtle text-muted-foreground">{label}</span>
    </button>
  );
}

export function CoachRequestsScreen() {
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [newOpen, setNewOpen] = useState(false);

  const { requests, isLoading, error, mutate } = useRegistrationRequests({ pageSize: 100 });
  const { result: transfers, isLoading: transfersLoading, error: transfersError, mutate: reloadTransfers } = useTransferRequests();
  const { result: photoResult, isLoading: photoLoading, error: photoError, mutate: reloadPhotoRequests } = usePhotoChangeRequests();
  const {
    result: provinceResult,
    isLoading: provinceLoading,
    error: provinceError,
    mutate: reloadProvinceRequests,
  } = useProvinceChangeRequests();
  const { belts } = useBelts();

  const rows: RequestListRow[] = [
    ...requests.map((request): RequestListRow => {
      const belt = belts.find((item) => item.id === request.beltId);
      return {
        key: `registration-${request.id}`,
        kind: "registration",
        id: request.id,
        title: `ثبت «${request.fullName}»`,
        subtitle: `کد ملی ${request.nationalCode}${belt ? ` — ${belt.label}` : ""}`,
        note: request.reviewNote,
        photoMissing: request.status !== "APPROVED" && !request.photoUrl,
        createdAt: request.createdAt,
        status: request.status,
      };
    }),
    ...(transfers?.data ?? [])
      .filter((request) => "direction" in request)
      .map(
        (request): RequestListRow => ({
          key: `transfer-${request.id}`,
          kind: "transfer",
          id: request.id,
          title: request.studentName ? `انتقال «${request.studentName}»` : "درخواست انتقال هنرجو",
          subtitle: request.direction === "incoming" ? "درخواست از مربی دیگر" : null,
          note: request.note,
          photoMissing: false,
          createdAt: request.createdAt,
          status: request.status,
        }),
      ),
    ...(photoResult?.data ?? [])
      .filter((request) => !("coachName" in request))
      .map(
        (request): RequestListRow => ({
          key: `photo-${request.id}`,
          kind: "photo",
          id: request.id,
          title: request.studentName ? `تغییر عکس «${request.studentName}»` : "درخواست تغییر عکس",
          subtitle: null,
          note: request.note,
          photoMissing: false,
          createdAt: request.createdAt,
          status: request.status,
        }),
      ),
    ...(provinceResult?.data ?? []).map(
      (request): RequestListRow => ({
        key: `province-${request.id}`,
        kind: "province",
        id: request.id,
        title: `تغییر استان «${request.studentName}»`,
        subtitle: null,
        note: request.note,
        photoMissing: false,
        createdAt: request.createdAt,
        status: request.status,
      }),
    ),
  ].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const countByKind = (kind: RequestKind) => rows.filter((row) => row.kind === kind).length;
  const typeCounts: Record<string, number> = {
    all: rows.length,
    registration: countByKind("registration"),
    transfer: countByKind("transfer"),
    photo: countByKind("photo"),
    province: countByKind("province"),
  };
  const statusCounts: Record<string, number> = {
    all: rows.length,
    PENDING: rows.filter((row) => row.status === "PENDING").length,
    APPROVED: rows.filter((row) => row.status === "APPROVED").length,
    REJECTED: rows.filter((row) => row.status === "REJECTED").length,
  };

  const visibleRows = rows.filter(
    (row) => (typeFilter === "all" || row.kind === typeFilter) && (statusFilter === "all" || row.status === statusFilter),
  );

  const columns: DataTableColumn<RequestListRow>[] = [
    { id: "request", header: "درخواست", cell: (row) => <RequestCell row={row} />, sortValue: (row) => row.title },
    { id: "kind", header: "نوع", cell: (row) => kindLabels[row.kind], minScreen: "lg" },
    {
      id: "createdAt",
      header: "تاریخ",
      cell: (row) => (row.createdAt ? formatJalaliDate(new Date(row.createdAt)) : "—"),
      sortValue: (row) => row.createdAt ?? "",
      minScreen: "lg",
    },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={statusKeyOf(row.kind, row.status)} /> },
    { id: "actions", header: "عملیات", cell: (row) => <RowActions row={row} onChanged={mutate} />, minScreen: "lg" },
  ];

  const pendingIdsOf = (kind: RequestKind) =>
    new Set(rows.filter((row) => row.kind === kind && row.status === "PENDING").map((row) => row.id));
  const refreshAll = () => {
    void mutate();
    void reloadTransfers();
    void reloadPhotoRequests();
    void reloadProvinceRequests();
  };

  return (
    <>
      <PageHeader
        title="درخواست ها"
        description="همه درخواست های شما: ثبت هنرجو، انتقال، تغییر عکس و تغییر استان"
        action={
          <Button type="button" onClick={() => setNewOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            ثبت درخواست جدید
          </Button>
        }
      />

      <NewRequestDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        pendingPhotoIds={pendingIdsOf("photo")}
        pendingCoachIds={pendingIdsOf("transfer")}
        pendingProvinceIds={pendingIdsOf("province")}
        onRequested={refreshAll}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {statusCards.map((card) => (
          <StatusCard
            key={card.id}
            value={statusCounts[card.id] ?? 0}
            label={card.label}
            active={statusFilter === card.id}
            onClick={() => setStatusFilter((current) => (current === card.id ? "all" : card.id))}
          />
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={visibleRows}
        getRowId={(row) => row.key}
        isLoading={isLoading || transfersLoading || photoLoading || provinceLoading}
        error={error ?? transfersError ?? photoError ?? provinceError}
        onRetry={() => {
          void mutate();
          void reloadTransfers();
          void reloadPhotoRequests();
          void reloadProvinceRequests();
        }}
        renderCard={(row) => <RequestCard row={row} onChanged={mutate} />}
        emptyIcon={InboxIcon}
        emptyTitle="درخواستی ثبت نشده است"
        toolbar={
          <ListToolbar
            tabs={typeTabs}
            counts={typeCounts}
            statusValue={typeFilter}
            onStatusChange={(id) => setTypeFilter(id as RequestTypeFilter)}
          />
        }
      />
    </>
  );
}
