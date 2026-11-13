"use client";

import { ShieldCheckIcon, UserRoundPlusIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useSearchParam, useSearchParamText } from "@/lib/use-search-param";
import { useAdmins } from "../hooks/use-admins";
import type { AdminUser } from "../types";
import { AdminCard } from "./admin-card";
import { AdminCreateDialog } from "./admin-create-dialog";
import { AdminEditDialog } from "./admin-edit-dialog";
import { AdminResetPasswordDialog } from "./admin-reset-password-dialog";
import { AdminStatusDialog } from "./admin-status-dialog";
import { adminsColumns } from "./admins-columns";

const statusTabs = [
  { id: "all", label: "همه" },
  { id: "active", label: "فعال" },
  { id: "inactive", label: "غیرفعال" },
];

export function AdminsScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const search = useSearchParamText("q");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ admin: AdminUser; isActive: boolean } | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

  const { admins, isLoading, error, mutate } = useAdmins({
    search: search.value.trim() || undefined,
    status: statusFilter === "" ? undefined : (statusFilter as "active" | "inactive"),
  });

  const counts = {
    all: admins.length,
    active: admins.filter((admin) => admin.isActive).length,
    inactive: admins.filter((admin) => !admin.isActive).length,
  };

  const columns = adminsColumns({
    onToggleStatus: (admin) => setPendingStatus({ admin, isActive: !admin.isActive }),
    onEdit: (admin) => setEditing(admin),
    onResetPassword: (admin) => setResetTarget(admin),
  });

  return (
    <>
      <PageHeader
        title="ادمین های استان"
        description="ساخت و مدیریت حساب ادمین های استان ها"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <UserRoundPlusIcon data-icon="inline-start" />
            ادمین جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={admins}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => (
          <AdminCard
            admin={row}
            onToggleStatus={(admin) => setPendingStatus({ admin, isActive: !admin.isActive })}
            onEdit={(admin) => setEditing(admin)}
            onResetPassword={(admin) => setResetTarget(admin)}
          />
        )}
        emptyIcon={ShieldCheckIcon}
        emptyTitle={search.value.trim() !== "" ? `نتیجه ای برای «${search.value.trim()}» پیدا نشد` : "هنوز ادمینی اضافه نشده است"}
        toolbar={
          <ListToolbar
            tabs={statusTabs}
            counts={counts}
            statusValue={statusFilter === "" ? "all" : statusFilter}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
            search={search}
            searchLabel="جستجوی ادمین"
          />
        }
      />

      <AdminCreateDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => void mutate()} />
      <AdminEditDialog admin={editing} onOpenChange={(open) => (open ? null : setEditing(null))} onSaved={() => void mutate()} />
      <AdminStatusDialog
        admin={pendingStatus?.admin ?? null}
        targetActive={pendingStatus?.isActive ?? null}
        onDone={mutate}
        onClose={() => setPendingStatus(null)}
      />
      <AdminResetPasswordDialog admin={resetTarget} onDone={mutate} onClose={() => setResetTarget(null)} />
    </>
  );
}
