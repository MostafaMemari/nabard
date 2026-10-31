"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, DataTable, type DataTableColumn, PageHeader, StatusBadge } from "@/components/shared";
import { useCompetitions } from "@/features/competitions";
import { useRegistrations } from "@/features/registrations";
import { useCoaches } from "@/features/users";
import { formatJalaliDate, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { usePayments } from "../hooks/use-payments";
import type { Payment } from "../types";

const statusTabs = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار بررسی" },
  { id: "confirmed", label: "تأیید شده" },
  { id: "rejected", label: "رد شده" },
] as const;

const tabToStatus = { pending: "PENDING", confirmed: "CONFIRMED", rejected: "REJECTED" } as const;

export function PaymentsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "all";

  const { payments, isLoading, error, mutate } = usePayments();
  const { coaches } = useCoaches();
  const { competitions } = useCompetitions();
  const { registrations } = useRegistrations();

  const counts = {
    all: payments.length,
    pending: payments.filter((payment) => payment.status === "PENDING").length,
    confirmed: payments.filter((payment) => payment.status === "CONFIRMED").length,
    rejected: payments.filter((payment) => payment.status === "REJECTED").length,
  };

  const rows = payments.filter((payment) => {
    const status = tabToStatus[statusFilter as keyof typeof tabToStatus];
    return statusFilter === "all" || payment.status === status;
  });

  function setParams(next: { status?: string }) {
    const params = new URLSearchParams();
    const status = next.status ?? statusFilter;
    if (status !== "all") {
      params.set("status", status);
    }
    const query = params.toString();
    router.replace(query === "" ? "/admin/payments" : `/admin/payments?${query}`, { scroll: false });
  }

  const columns: DataTableColumn<Payment>[] = [
    {
      id: "coach",
      header: "مربی",
      cell: (row) => {
        const coach = coaches.find((item) => item.id === row.coachId);
        return (
          <div className="flex items-center gap-2.5">
            <Avatar id={row.coachId} name={coach?.fullName ?? row.coachId} size="sm" />
            <span className="font-medium">{coach?.fullName ?? row.coachId}</span>
          </div>
        );
      },
      sortValue: (row) => coaches.find((item) => item.id === row.coachId)?.fullName ?? row.coachId,
    },
    {
      id: "competition",
      header: "مسابقه",
      cell: (row) => competitions.find((item) => item.id === row.competitionId)?.title ?? row.competitionId,
      sortValue: (row) => competitions.find((item) => item.id === row.competitionId)?.title ?? row.competitionId,
    },
    {
      id: "students",
      header: "هنرجویان",
      cell: (row) => toPersianDigits(registrations.filter((item) => item.paymentId === row.id).length),
      align: "end",
    },
    { id: "amount", header: "مبلغ", cell: (row) => formatRialsAsToman(Number(row.amount)), align: "end" },
    { id: "date", header: "تاریخ", cell: (row) => formatJalaliDate(new Date(row.createdAt)) },
    {
      id: "status",
      header: "وضعیت",
      cell: (row) => (
        <StatusBadge status={row.status === "PENDING" ? "PENDING_REVIEW" : row.status === "CONFIRMED" ? "APPROVED" : "REJECTED"} />
      ),
    },
  ];

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
        emptyTitle="پرداختی برای بررسی وجود ندارد."
        toolbar={
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => {
              const isActive = tab.id === statusFilter;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setParams({ status: tab.id })}
                  className={
                    isActive
                      ? "inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary-subtle px-3 text-sm font-medium text-primary"
                      : "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  }
                >
                  {tab.label}
                  <span className={isActive ? "text-primary/70" : "text-muted-foreground/70"}>{counts[tab.id]}</span>
                </button>
              );
            })}
          </div>
        }
      />
    </>
  );
}
