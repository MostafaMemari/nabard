"use client";

import { ReceiptTextIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, ListToolbar, PageHeader } from "@/components/shared";
import { useSearchParam } from "@/lib/use-search-param";
import { usePayments } from "../hooks/use-payments";
import { paymentsTabs } from "../tabs";
import { PaymentCard } from "./payment-card";
import { usePaymentColumns } from "./payments-columns";

export function PaymentsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useSearchParam("status");
  const { payments, isLoading, error, mutate } = usePayments();
  const columns = usePaymentColumns();

  const counts = {
    all: payments.length,
    pending: payments.filter((payment) => payment.status === "PENDING").length,
    confirmed: payments.filter((payment) => payment.status === "CONFIRMED").length,
    rejected: payments.filter((payment) => payment.status === "REJECTED").length,
  };

  const activeTab = paymentsTabs.find((tab) => tab.id === statusFilter);
  const rows = activeTab?.status ? payments.filter((payment) => payment.status === activeTab.status) : payments;

  return (
    <>
      <PageHeader title="بررسی پرداخت‌ها" description="بررسی و تأیید رسیدهای پرداخت مربیان." />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        onRowClick={(row) => router.push(`/admin/payments/${row.id}`)}
        renderCard={(row) => <PaymentCard payment={row} />}
        emptyIcon={ReceiptTextIcon}
        emptyTitle="پرداختی برای بررسی وجود ندارد."
        toolbar={
          <ListToolbar
            tabs={paymentsTabs}
            counts={counts}
            statusValue={activeTab?.id ?? "all"}
            onStatusChange={(id) => setStatusFilter(id === "all" ? null : id)}
          />
        }
      />
    </>
  );
}
