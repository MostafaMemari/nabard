"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompetitions } from "@/features/competitions";
import { updateRegistrationStatus } from "@/features/registrations";
import { useCoaches } from "@/features/users";
import { confirmPayment, rejectPayment } from "../api";
import { usePaymentRegistrations } from "../hooks/use-payment-registrations";
import { usePayment } from "../hooks/use-payments";
import type { PaymentStatus } from "../types";
import { PaymentReceiptCard } from "./payment-receipt-card";
import { PaymentRejectDialog } from "./payment-reject-dialog";
import { PaymentSideSummary } from "./payment-side-summary";
import { PaymentStudentsTable } from "./payment-students-table";

function statusBadge(status: PaymentStatus) {
  return status === "PENDING" ? "PENDING_REVIEW" : status === "CONFIRMED" ? "APPROVED" : "REJECTED";
}

export function PaymentDetailScreen({ paymentId }: { paymentId: string }) {
  const { payment, isLoading, error, mutate } = usePayment(paymentId);
  const { registrations, students, isLoading: rowsLoading, mutate: mutateRegistrations } = usePaymentRegistrations(paymentId);
  const { coaches } = useCoaches();
  const { competitions } = useCompetitions();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
        پرداخت یافت نشد.
        <Button type="button" variant="ghost" size="sm" className="ms-2" onClick={() => mutate()}>
          تلاش دوباره
        </Button>
      </div>
    );
  }

  const coach = coaches.find((item) => item.id === payment.coachId);
  const competition = competitions.find((item) => item.id === payment.competitionId);

  async function decideReceipt(action: "confirm" | "reject", note?: string) {
    setWorking(true);
    try {
      if (action === "confirm") {
        await confirmPayment(paymentId);
        toast.success("رسید تأیید شد.");
      } else {
        await rejectPayment(paymentId, note ?? "");
        toast.success("رسید رد شد.");
      }
      await mutate();
      setRejectOpen(false);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  async function decideRegistration(registrationId: string, status: "APPROVED" | "REJECTED") {
    setBusyId(registrationId);
    try {
      await updateRegistrationStatus(registrationId, status);
      toast.success(status === "APPROVED" ? "ثبت‌نام تأیید شد." : "ثبت‌نام رد شد.");
      await mutateRegistrations();
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 w-fit text-muted-foreground"
        render={
          <Link href="/admin/payments">
            <ArrowRightIcon data-icon="inline-start" />
            بررسی پرداخت‌ها
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight">رسید پرداخت مربی</h1>
          <p className="text-subtle text-muted-foreground">بررسی رسید و تأیید یا رد ثبت‌نام هنرجویان.</p>
        </div>
        <StatusBadge status={statusBadge(payment.status)} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <PaymentReceiptCard payment={payment} />
          <PaymentStudentsTable
            registrations={registrations}
            students={students}
            isLoading={rowsLoading}
            canApprove={payment.status === "CONFIRMED"}
            busyId={busyId}
            onApprove={(registration) => decideRegistration(registration.id, "APPROVED")}
            onReject={(registration) => decideRegistration(registration.id, "REJECTED")}
          />
        </div>
        <PaymentSideSummary
          payment={payment}
          coach={coach}
          competition={competition}
          studentCount={registrations.length}
          working={working}
          onConfirmReceipt={() => decideReceipt("confirm")}
          onOpenReject={() => setRejectOpen(true)}
        />
      </div>

      <PaymentRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        loading={working}
        onConfirm={(note) => decideReceipt("reject", note)}
      />
    </div>
  );
}
