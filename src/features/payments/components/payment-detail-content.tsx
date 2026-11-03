"use client";

import { DetailPageHeader, StatusBadge } from "@/components/shared";
import { useCompetitions } from "@/features/competitions";
import { useCoaches } from "@/features/users";
import type { usePaymentDecisions } from "../hooks/use-payment-decisions";
import { paymentBadgeStatus } from "../status";
import { PaymentDetailMain } from "./payment-detail-main";
import { PaymentRejectDialog } from "./payment-reject-dialog";
import { PaymentSideSummary } from "./payment-side-summary";

type Decisions = ReturnType<typeof usePaymentDecisions>;

export function PaymentDetailContent({ decisions }: { decisions: Decisions }) {
  const { coaches } = useCoaches();
  const { competitions } = useCompetitions();
  const { payment, registrations, students, rowsLoading, rejectOpen, setRejectOpen, working, busyId, decideReceipt, decideRegistration } =
    decisions;

  if (!payment) {
    return null;
  }

  const coach = coaches.find((item) => item.id === payment.coachId);
  const competition = competitions.find((item) => item.id === payment.competitionId);

  return (
    <div className="flex flex-col gap-6">
      <DetailPageHeader
        backHref="/admin/payments"
        backLabel="بررسی پرداخت ها"
        title="رسید پرداخت مربی"
        description="بررسی رسید و تأیید یا رد ثبت نام هنرجویان."
        action={<StatusBadge status={paymentBadgeStatus(payment.status)} />}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PaymentDetailMain
          payment={payment}
          registrations={registrations}
          students={students}
          rowsLoading={rowsLoading}
          busyId={busyId}
          onApprove={(registration) => decideRegistration(registration.id, "APPROVED")}
          onReject={(registration) => decideRegistration(registration.id, "REJECTED")}
        />
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
