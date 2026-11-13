"use client";

import { Undo2Icon } from "lucide-react";
import { useState } from "react";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { useRefunds } from "../hooks/use-refunds";
import { refundsTabs } from "../tabs";
import type { Refund } from "../types";
import { CompleteRefundDialog } from "./complete-refund-dialog";
import { RefundCard } from "./refund-card";
import { useRefundColumns } from "./refunds-columns";

export function RefundsScreen() {
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const [target, setTarget] = useState<Refund | null>(null);
  const { refunds, isLoading, error, mutate } = useRefunds();
  const columns = useRefundColumns({ onComplete: setTarget });

  const counts = {
    all: refunds.length,
    pending: refunds.filter((refund) => refund.status === "PENDING").length,
    completed: refunds.filter((refund) => refund.status === "COMPLETED").length,
  };

  const activeTab = refundsTabs.find((tab) => tab.id === statusFilter);
  const rows = activeTab?.status ? refunds.filter((refund) => refund.status === activeTab.status) : refunds;

  return (
    <>
      <PageHeader title="بازپرداخت ها" description="بازپرداخت های رد ثبت نام و لغو مسابقه به مربیان" />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        renderCard={(row) => <RefundCard refund={row} onComplete={setTarget} />}
        emptyIcon={Undo2Icon}
        emptyTitle="بازپرداختی ثبت نشده است"
        toolbar={
          <ListToolbar
            tabs={refundsTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />

      <CompleteRefundDialog refund={target} onClose={() => setTarget(null)} onCompleted={() => void mutate()} />
    </>
  );
}
