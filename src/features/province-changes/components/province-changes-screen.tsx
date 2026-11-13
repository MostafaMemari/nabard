"use client";

import { MapPinnedIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { useProvinceChangeRequests } from "../hooks/use-province-changes";
import { provinceChangeTabs } from "../tabs";
import type { ProvinceChangeRequest } from "../types";
import { ProvinceChangeCard } from "./province-change-card";
import { useProvinceChangeColumns } from "./province-change-columns";
import { ProvinceChangeDecisionDialog } from "./province-change-decision-dialog";

type Decision = { request: ProvinceChangeRequest; decision: "approve" | "reject" };

// Review queue of the DESTINATION province admin: requests moving students
// into this province.
export function ProvinceChangesScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const [target, setTarget] = useState<Decision | null>(null);
  const { result, isLoading, error, mutate } = useProvinceChangeRequests();
  const columns = useProvinceChangeColumns({
    onDecide: (request, decision) => setTarget({ request, decision }),
  });

  const requests = result?.data ?? [];
  const counts = {
    all: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
  };

  const activeTab = provinceChangeTabs.find((tab) => tab.id === (statusFilter || "all"));
  const rows = activeTab?.status ? requests.filter((request) => request.status === activeTab.status) : requests;

  return (
    <>
      <PageHeader title="تغییر استان هنرجو" description="درخواست انتقال هنرجوها به استان شما؛ با تأیید، هنرجو به مربی مقصد منتقل می شود" />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => <ProvinceChangeCard request={row} onDecide={(request, decision) => setTarget({ request, decision })} />}
        emptyIcon={MapPinnedIcon}
        emptyTitle="درخواست تغییر استان ثبت نشده است"
        toolbar={
          <ListToolbar
            tabs={provinceChangeTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />

      <ProvinceChangeDecisionDialog
        request={target?.request ?? null}
        decision={target?.decision ?? "approve"}
        onClose={() => setTarget(null)}
        onDecided={() => void mutate()}
      />
    </>
  );
}
