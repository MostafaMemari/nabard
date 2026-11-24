"use client";

import { InboxIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn, type FilterTab, ListToolbar, PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { NewRequestDialog } from "@/features/requests/components/new-request-dialog";
import { RequestCard, RequestCell, RowActions } from "@/features/requests/components/request-card";
import { kindLabels, type RequestKind, type RequestListRow, statusKeyOf } from "@/features/requests/components/request-rows";
import { RequestStatusCard } from "@/features/requests/components/request-status-card";
import { useRequestRows } from "@/features/requests/components/use-request-rows";
import type { RegistrationStatus } from "@/features/students/types";
import { formatJalaliDate } from "@/lib/format";

type RequestTypeFilter = "all" | RequestKind;
type RequestStatusFilter = "all" | RegistrationStatus;

const typeTabs: FilterTab[] = [
  { id: "all", label: "همه" },
  { id: "registration", label: "ثبت هنرجو" },
  { id: "transfer", label: "انتقال هنرجو" },
  { id: "photo", label: "تغییر عکس" },
  { id: "province", label: "تغییر استان" },
];

const statusCards: Array<{ id: Exclude<RequestStatusFilter, "all">; label: string }> = [
  { id: "PENDING", label: "در انتظار تأیید" },
  { id: "APPROVED", label: "تأیید شده" },
  { id: "REJECTED", label: "رد شده" },
];

export function CoachRequestsScreen() {
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [newOpen, setNewOpen] = useState(false);

  const { rows, isLoading, error, mutate, refreshAll } = useRequestRows();

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
          <RequestStatusCard
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
        isLoading={isLoading}
        error={error}
        onRetry={() => refreshAll()}
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
