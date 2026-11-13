"use client";

import { ArrowLeftRightIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { useTransferRequests } from "../hooks/use-transfers";
import { transferTabs } from "../tabs";
import type { TransferRequest } from "../types";
import { TransferCard } from "./transfer-card";
import { useTransferColumns } from "./transfer-columns";
import { TransferDecisionDialog } from "./transfer-decision-dialog";

type Decision = { request: TransferRequest; decision: "approve" | "reject" };

export function TransfersScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const [target, setTarget] = useState<Decision | null>(null);
  const { result, isLoading, error, mutate } = useTransferRequests();
  const requests = (result?.data ?? []).filter((request): request is TransferRequest => "studentName" in request);
  const columns = useTransferColumns({
    onDecide: (request, decision) => setTarget({ request, decision }),
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
  };

  const activeTab = transferTabs.find((tab) => tab.id === (statusFilter || "all"));
  const rows = activeTab?.status ? requests.filter((request) => request.status === activeTab.status) : requests;

  return (
    <>
      <PageHeader title="درخواست های انتقال" description="درخواست های انتقال هنرجو بین مربیان استان و نتیجه بررسی آنها" />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => <TransferCard request={row} onDecide={(request, decision) => setTarget({ request, decision })} />}
        emptyIcon={ArrowLeftRightIcon}
        emptyTitle="درخواستی ثبت نشده است"
        toolbar={
          <ListToolbar
            tabs={transferTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />

      <TransferDecisionDialog
        request={target?.request ?? null}
        decision={target?.decision ?? "approve"}
        onClose={() => setTarget(null)}
        onDecided={() => void mutate()}
      />
    </>
  );
}
