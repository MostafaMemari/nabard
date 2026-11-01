"use client";

import { ArrowLeftRightIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { useCountyChanges } from "../hooks/use-county-changes";
import { countyChangeTabs } from "../tabs";
import type { CountyChangeRequest } from "../types";
import { CountyChangeCard } from "./county-change-card";
import { useCountyChangeColumns } from "./county-change-columns";
import { CountyChangeDecisionDialog } from "./county-change-decision-dialog";

type Decision = { request: CountyChangeRequest; decision: "approve" | "reject" };

export function CountyChangesScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const [target, setTarget] = useState<Decision | null>(null);
  const { requests, isLoading, error, mutate } = useCountyChanges();
  const columns = useCountyChangeColumns({
    onDecide: (request, decision) => setTarget({ request, decision }),
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
  };

  const activeTab = countyChangeTabs.find((tab) => tab.id === statusFilter);
  const rows = activeTab?.status ? requests.filter((request) => request.status === activeTab.status) : requests;

  return (
    <>
      <PageHeader title="درخواست های مربیان" description="درخواست های تغییر شهرستان مربیان استان و نتیجه بررسی آنها." />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => <CountyChangeCard request={row} onDecide={(request, decision) => setTarget({ request, decision })} />}
        emptyIcon={ArrowLeftRightIcon}
        emptyTitle="درخواستی ثبت نشده است."
        toolbar={
          <ListToolbar
            tabs={countyChangeTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />

      <CountyChangeDecisionDialog
        request={target?.request ?? null}
        decision={target?.decision ?? "approve"}
        onClose={() => setTarget(null)}
        onDecided={() => void mutate()}
      />
    </>
  );
}
